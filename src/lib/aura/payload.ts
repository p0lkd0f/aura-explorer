import type { AuraPayload, AuraContext, FullHttpRequest, SessionValidation } from './types';

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function buildPayload(
  controller: string,
  action: string,
  params: Record<string, unknown> = {},
  options: { cacheable?: boolean; isContinuation?: boolean } = {}
): AuraPayload {
  return {
    actions: [{
      id: generateUUID(),
      descriptor: `aura://${controller}/ACTION$${action}`,
      callingDescriptor: 'UNKNOWN',
      params,
      cacheable: options.cacheable ?? false,
      isContinuation: options.isContinuation ?? false
    }]
  };
}

export function buildMultiActionPayload(
  actions: Array<{
    controller: string;
    action: string;
    params?: Record<string, unknown>;
  }>
): AuraPayload {
  return {
    actions: actions.map(a => ({
      id: generateUUID(),
      descriptor: `aura://${a.controller}/ACTION$${a.action}`,
      callingDescriptor: 'UNKNOWN',
      params: a.params || {}
    }))
  };
}

export function buildContext(options: Partial<AuraContext> = {}): AuraContext {
  const app = options.app || 'siteforce:loginApp2';
  // Build the loaded object with APPLICATION markup if not provided
  const defaultLoaded: Record<string, string> = {};
  if (app) {
    defaultLoaded[`APPLICATION@markup://${app}`] = '';
  }
  
  return {
    mode: options.mode || 'PROD',
    fwuid: options.fwuid || '',
    app,
    loaded: options.loaded || defaultLoaded,
    dn: options.dn || [],
    globals: options.globals || {},
    uad: options.uad ?? true
  };
}

export function buildRawRequest(
  targetUrl: string,
  payload: AuraPayload,
  context: AuraContext,
  token: string = 'null',
  cookies: string = ''
): FullHttpRequest {
  const url = new URL(targetUrl);
  
  const body = [
    `message=${encodeURIComponent(JSON.stringify(payload))}`,
    `aura.context=${encodeURIComponent(JSON.stringify(context))}`,
    `aura.token=${token}`
  ].join('&');

  // Always use origin + /s/sfsites/aura - ignore the original path
  const auraEndpoint = `${url.origin}/s/sfsites/aura`;
  const queryParams = new URLSearchParams({
    r: '1',
    'aura.ApexAction.execute': '1'
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Origin': url.origin,
    'Referer': targetUrl,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache'
  };

  // Add cookies if provided
  if (cookies.trim()) {
    headers['Cookie'] = cookies.trim();
  }

  return {
    method: 'POST',
    url: `${auraEndpoint}?${queryParams.toString()}`,
    headers,
    body
  };
}

export function validateSession(token: string, fwuid: string, cookies: string): SessionValidation {
  const cookieLower = cookies.toLowerCase();
  return {
    hasToken: token !== 'null' && token.trim().length > 0,
    hasFwuid: fwuid.trim().length > 0,
    hasCookies: cookies.trim().length > 0,
    hasSid: cookieLower.includes('sid='),
    hasRenderCtx: cookieLower.includes('renderctx'),
    hasAuraContext: cookieLower.includes('auracontext') || cookieLower.includes('aura.context'),
  };
}

export function formatAsCurl(request: FullHttpRequest): string {
  const headers = Object.entries(request.headers)
    .map(([k, v]) => `-H '${k}: ${v}'`)
    .join(' \\\n  ');

  // Format body with line breaks for readability
  const formattedBody = request.body
    .replace(/&/g, '&\\\n');

  return `curl -X ${request.method} '${request.url}' \\
  ${headers} \\
  --data-raw '${formattedBody}'`;
}

export function formatAsBurp(request: FullHttpRequest): string {
  const url = new URL(request.url);
  const headerLines = Object.entries(request.headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  // Format body with line breaks for readability
  const formattedBody = request.body
    .replace(/&aura\./g, '\n&aura.');

  return `${request.method} ${url.pathname}${url.search} HTTP/1.1
Host: ${url.host}
${headerLines}

${formattedBody}`;
}
