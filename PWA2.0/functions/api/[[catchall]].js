/**
 * Cloudflare Pages Function: Reverse-proxies /api/* requests to the canonical Render backend.
 */
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const BACKEND_BASE = 'https://timelogic-backend.onrender.com';
  const targetUrl = `${BACKEND_BASE}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('Host', 'timelogic-backend.onrender.com');

  // Buffer body in memory so it can be re-sent safely if retry is needed
  let bodyBuffer = undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      bodyBuffer = await request.arrayBuffer();
    } catch {
      bodyBuffer = undefined;
    }
  }

  const createReq = () => new Request(targetUrl, {
    method: request.method,
    headers,
    body: bodyBuffer,
    redirect: 'follow',
  });

  try {
    let response;
    try {
      response = await fetch(createReq());
    } catch (firstErr) {
      // If Render container was cold-starting or connection dropped, retry once
      await new Promise((r) => setTimeout(r, 600));
      response = await fetch(createReq());
    }

    if (response.status === 502 || response.status === 503) {
      await new Promise((r) => setTimeout(r, 800));
      const retry = await fetch(createReq()).catch(() => null);
      if (retry && retry.ok) response = retry;
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', url.origin);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');

    // Strip backend infrastructure headers so router is completely invisible
    responseHeaders.delete('server');
    responseHeaders.delete('via');
    responseHeaders.delete('nel');
    responseHeaders.delete('report-to');
    responseHeaders.delete('reporting-endpoints');
    responseHeaders.delete('x-powered-by');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'TimeLogic backend is warming up. Please try again in a few moments.',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': url.origin,
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }
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
