import type { AuraPayload, AuraContext, FullHttpRequest } from './types';

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
  return {
    mode: options.mode || 'PROD',
    fwuid: options.fwuid || '',
    app: options.app || 'siteforce:loginApp2',
    loaded: options.loaded || {},
    dn: options.dn || [],
    globals: options.globals || {},
    uad: options.uad ?? true
  };
}

export function buildRawRequest(
  targetUrl: string,
  payload: AuraPayload,
  context: AuraContext,
  token: string = 'null'
): FullHttpRequest {
  const url = new URL(targetUrl);
  
  const body = [
    `message=${encodeURIComponent(JSON.stringify(payload))}`,
    `aura.context=${encodeURIComponent(JSON.stringify(context))}`,
    `aura.token=${token}`
  ].join('&');

  const auraEndpoint = `${url.origin}${url.pathname.replace(/\/$/, '')}/s/sfsites/aura`;
  const queryParams = new URLSearchParams({
    r: '1',
    'aura.ApexAction.execute': '1'
  });

  return {
    method: 'POST',
    url: `${auraEndpoint}?${queryParams.toString()}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': url.origin,
      'Referer': targetUrl,
      'User-Agent': 'AuraScanner/1.0',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    },
    body
  };
}

export function formatAsCurl(request: FullHttpRequest): string {
  const headers = Object.entries(request.headers)
    .map(([k, v]) => `-H '${k}: ${v}'`)
    .join(' \\\n  ');

  return `curl -X ${request.method} '${request.url}' \\
  ${headers} \\
  --data-raw '${request.body}'`;
}

export function formatAsBurp(request: FullHttpRequest): string {
  const url = new URL(request.url);
  const headerLines = Object.entries(request.headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return `${request.method} ${url.pathname}${url.search} HTTP/1.1
Host: ${url.host}
${headerLines}

${request.body}`;
}
