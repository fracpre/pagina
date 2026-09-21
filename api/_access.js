const fs = require('fs');
const path = require('path');

const notFoundPage = path.join(__dirname, '..', '404.html');

function isAllowedRequest(req) {
  const site = ((req.headers['sec-fetch-site'] || '') + '').toLowerCase();
  if (site === 'same-origin' || site === 'same-site') return true;

  const referer = (req.headers.referer || req.headers.referrer || '').toLowerCase();
  const host = (req.headers.host || '').toLowerCase();
  const origin = (req.headers.origin || '').toLowerCase();

  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return true;

  if (origin && (origin.includes('fracon.top') || (host && origin.includes(host)))) return true;
  if (referer && (referer.includes('fracon.top') || (host && referer.includes(host)))) return true;

  return false;
}

function send404(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  fs.readFile(notFoundPage, (readErr, data) => {
    if (readErr) {
      res.end('Not found');
      return;
    }
    res.end(data);
  });
}

module.exports = { isAllowedRequest, send404 };
