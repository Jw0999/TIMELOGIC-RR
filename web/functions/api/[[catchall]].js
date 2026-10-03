/**
 * Cloudflare Pages Function: Reverse-proxies /api/* requests to Heroku backend.
 * This completely hides the Heroku API domain from the client browser / Network tab.
 */
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const BACKEND_BASE = 'https://timelogic-api-fbd3128caa55.herokuapp.com';
  const targetUrl = `${BACKEND_BASE}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('Host', 'timelogic-api-fbd3128caa55.herokuapp.com');

  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'follow',
  });

  const response = await fetch(modifiedRequest);

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', url.origin);
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function onRequestOptions(context) {
  const { request } = context;
  const url = new URL(request.url);
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': url.origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Cache-Control, Pragma, X-Requested-With, X-Organization-Id, x-organization-id',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}
