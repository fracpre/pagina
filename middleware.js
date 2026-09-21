export const config = {
  matcher: ['/assets', '/assets/:path*'],
};

function isAllowedAssetRequest(request) {
  const site = (request.headers.get('sec-fetch-site') || '').toLowerCase();
  if (site === 'same-origin' || site === 'same-site') return true;

  const referer = (request.headers.get('referer') || request.headers.get('referrer') || '').toLowerCase();
  const host = (request.headers.get('host') || '').toLowerCase();

  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return true;
  if (referer && (referer.includes('fracon.top') || (host && referer.includes(host)))) return true;

  return false;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/assets' || path === '/assets/') {
    const notFoundUrl = new URL('/404.html', request.url);
    const response = await fetch(notFoundUrl);
    const html = await response.text();
    return new Response(html, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (isAllowedAssetRequest(request)) {
    return;
  }

  const notFoundUrl = new URL('/404.html', request.url);
  const response = await fetch(notFoundUrl);
  const html = await response.text();
  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
