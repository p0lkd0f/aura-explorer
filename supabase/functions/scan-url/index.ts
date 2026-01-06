import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Aura action patterns
const AURA_DESCRIPTOR_PATTERN = /aura:\/\/([^/]+)\/ACTION\$([A-Za-z0-9_]+)/g;
const APEX_CONTROLLER_PATTERN = /apex:\/\/([^/]+)\/ACTION\$([A-Za-z0-9_]+)/g;

interface AuraAction {
  name: string;
  controller: string;
  descriptor: string;
  returnType: string;
  parameters: { name: string; type: string }[];
}

function parseAuraActions(html: string): AuraAction[] {
  const actions: AuraAction[] = [];
  const seen = new Set<string>();

  // Parse aura:// descriptors
  let match;
  while ((match = AURA_DESCRIPTOR_PATTERN.exec(html)) !== null) {
    const key = `${match[1]}:${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      actions.push({
        name: match[2],
        controller: match[1],
        descriptor: `aura://${match[1]}/ACTION$${match[2]}`,
        returnType: 'unknown',
        parameters: []
      });
    }
  }

  // Parse apex:// descriptors
  APEX_CONTROLLER_PATTERN.lastIndex = 0;
  while ((match = APEX_CONTROLLER_PATTERN.exec(html)) !== null) {
    const key = `apex:${match[1]}:${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      actions.push({
        name: match[2],
        controller: match[1],
        descriptor: `apex://${match[1]}/ACTION$${match[2]}`,
        returnType: 'unknown',
        parameters: []
      });
    }
  }

  return actions;
}

function extractMetadata(html: string): { fwuid: string | null; app: string | null; token: string | null } {
  const fwuidMatch = /"fwuid"\s*:\s*"([^"]+)"/.exec(html);
  const appMatch = /"app"\s*:\s*"([^"]+)"/.exec(html);
  const tokenMatch = /aura\.token\s*=\s*["']([^"']+)["']/.exec(html);

  return {
    fwuid: fwuidMatch ? fwuidMatch[1] : null,
    app: appMatch ? appMatch[1] : null,
    token: tokenMatch ? tokenMatch[1] : null
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[scan-url] Scanning: ${targetUrl.href}`);

    // Fetch the page
    const response = await fetch(targetUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      console.error(`[scan-url] Fetch failed: ${response.status}`);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch URL: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    console.log(`[scan-url] Fetched ${html.length} bytes`);

    // Parse Aura actions
    const actions = parseAuraActions(html);
    const metadata = extractMetadata(html);

    console.log(`[scan-url] Found ${actions.length} actions`);

    // Try to fetch JS files for more actions
    const jsUrls = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi)]
      .map(m => {
        try {
          return new URL(m[1], targetUrl.href).href;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .slice(0, 10); // Limit to first 10 JS files

    console.log(`[scan-url] Found ${jsUrls.length} JS files to scan`);

    // Fetch and parse JS files in parallel
    const jsPromises = jsUrls.map(async (jsUrl) => {
      try {
        const jsResponse = await fetch(jsUrl!, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        if (jsResponse.ok) {
          return jsResponse.text();
        }
      } catch (e) {
        console.log(`[scan-url] Failed to fetch ${jsUrl}: ${e}`);
      }
      return '';
    });

    const jsContents = await Promise.all(jsPromises);
    
    for (const jsContent of jsContents) {
      if (jsContent) {
        const jsActions = parseAuraActions(jsContent);
        for (const action of jsActions) {
          const key = `${action.controller}:${action.name}`;
          if (!actions.find(a => `${a.controller}:${a.name}` === key)) {
            actions.push(action);
          }
        }
      }
    }

    console.log(`[scan-url] Total actions after JS scan: ${actions.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        rawMatches: actions.length,
        controllers: actions,
        metadata,
        jsFilesScanned: jsUrls.length,
        pageSize: html.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[scan-url] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});