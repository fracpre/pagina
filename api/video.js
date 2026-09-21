const fs = require('fs');
const path = require('path');
const { isAllowedRequest, send404 } = require('./_access');

const videoDir = path.join(__dirname, 'protected_videos');

module.exports = (req, res) => {
  if (!isAllowedRequest(req)) {
    send404(res);
    return;
  }

  const name = req.query && req.query.name;
  if (!name) {
    send404(res);
    return;
  }

  const safePattern = /^[a-zA-Z0-9._-]+\.mp4$/;
  if (!safePattern.test(name) || path.basename(name) !== name) {
    send404(res);
    return;
  }

  const videoPath = path.join(videoDir, name);

  fs.stat(videoPath, (err, stats) => {
    if (err || !stats.isFile()) {
      send404(res);
      return;
    }

    const range = req.headers.range;
    if (!range) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', stats.size);
      const stream = fs.createReadStream(videoPath);
      stream.on('error', () => {
        if (!res.headersSent) res.statusCode = 500;
        try { res.end('Error interno'); } catch (e) {}
      });
      stream.pipe(res);
      return;
    }

    const parts = /bytes=(\d*)-(\d*)/.exec(range);
    let start = 0;
    let end = stats.size - 1;
    if (parts) {
      if (parts[1]) start = parseInt(parts[1], 10);
      if (parts[2]) end = parseInt(parts[2], 10);
    }
    if (isNaN(start) || isNaN(end) || start > end || start < 0) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${stats.size}`);
      res.end();
      return;
    }

    res.statusCode = 206;
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
    res.setHeader('Content-Length', end - start + 1);

    const stream = fs.createReadStream(videoPath, { start, end });
    stream.on('error', () => {
      if (!res.headersSent) res.statusCode = 500;
      try { res.end('Error interno'); } catch (e) {}
    });
    stream.pipe(res);
  });
};
