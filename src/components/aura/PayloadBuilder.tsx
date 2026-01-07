import { useState, useEffect, useMemo } from 'react';
import { Copy, Code2, Terminal, RefreshCw, Shield, ShieldAlert, ShieldCheck, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CodeEditor } from './CodeEditor';
import type { AuraAction, AuraPayload, AuraContext, FullHttpRequest, ScanResult, SessionValidation } from '@/lib/aura/types';
import { buildPayload, buildContext, buildRawRequest, formatAsCurl, formatAsBurp, validateSession } from '@/lib/aura/payload';
import { generateSampleParams } from '@/lib/aura/defaults';
import { toast } from 'sonner';

interface PayloadBuilderProps {
  action: AuraAction | null;
  scanResult?: ScanResult | null;
}

export function PayloadBuilder({ action, scanResult }: PayloadBuilderProps) {
  // Use scanned URL or default
  const defaultUrl = scanResult?.metadata?.scannedUrl || 'https://example.salesforce.com';
  
  const [targetUrl, setTargetUrl] = useState(defaultUrl);
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [context, setContext] = useState<AuraContext>(() => buildContext({
    fwuid: scanResult?.metadata?.fwuid || '',
    app: scanResult?.metadata?.app || 'siteforce:loginApp2',
  }));
  const [payload, setPayload] = useState<AuraPayload | null>(null);
  const [request, setRequest] = useState<FullHttpRequest | null>(null);
  const [token, setToken] = useState(scanResult?.metadata?.token || 'null');
  const [cookies, setCookies] = useState('');

  // Session validation
  const sessionValidation = useMemo<SessionValidation>(() => 
    validateSession(token, context.fwuid, cookies),
    [token, context.fwuid, cookies]
  );

  const sessionScore = useMemo(() => {
    const checks = [
      sessionValidation.hasToken,
      sessionValidation.hasFwuid,
      sessionValidation.hasCookies,
      sessionValidation.hasSid,
    ];
    return checks.filter(Boolean).length;
  }, [sessionValidation]);

  // Update context and URL when scan result changes
  useEffect(() => {
    if (scanResult?.metadata) {
      const { fwuid, app, scannedUrl, token: scannedToken } = scanResult.metadata;
      setContext(buildContext({
        fwuid: fwuid || '',
        app: app || 'siteforce:loginApp2',
      }));
      if (scannedUrl) {
        setTargetUrl(scannedUrl);
      }
      if (scannedToken) {
        setToken(scannedToken);
      }
    }
  }, [scanResult]);

  useEffect(() => {
    if (action) {
      setParams(generateSampleParams(action.parameters));
    }
  }, [action]);

  useEffect(() => {
    if (action) {
      const newPayload = buildPayload(action.controller, action.name, params);
      setPayload(newPayload);
      setRequest(buildRawRequest(targetUrl, newPayload, context, token, cookies));
    }
  }, [action, params, targetUrl, context, token, cookies]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (!action) {
    return (
      <div className="glow-card rounded-lg p-8 text-center">
        <Code2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          Select an action to build a payload
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Target Configuration */}
      <div className="glow-card rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          Target Configuration
        </h3>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="targetUrl" className="text-xs text-muted-foreground">
              Target URL
            </Label>
            <Input
              id="targetUrl"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="font-mono text-sm bg-muted/50 border-border/50"
              placeholder="https://target.salesforce.com"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fwuid" className="text-xs text-muted-foreground">
                Framework UID (fwuid)
              </Label>
              <Input
                id="fwuid"
                value={context.fwuid}
                onChange={(e) => setContext({ ...context, fwuid: e.target.value })}
                className="font-mono text-sm bg-muted/50 border-border/50"
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app" className="text-xs text-muted-foreground">
                App Name
              </Label>
              <Input
                id="app"
                value={context.app}
                onChange={(e) => setContext({ ...context, app: e.target.value })}
                className="font-mono text-sm bg-muted/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token" className="text-xs text-muted-foreground">
                Aura Token
              </Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono text-sm bg-muted/50 border-border/50"
                placeholder="null"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Session Configuration */}
      <div className="glow-card rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Cookie className="w-4 h-4 text-primary" />
            Session & Cookies
          </h3>
          <div className="flex items-center gap-2">
            {sessionScore === 0 && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <ShieldAlert className="w-3 h-3" />
                No Session
              </span>
            )}
            {sessionScore > 0 && sessionScore < 4 && (
              <span className="flex items-center gap-1 text-xs text-yellow-500">
                <Shield className="w-3 h-3" />
                Partial ({sessionScore}/4)
              </span>
            )}
            {sessionScore === 4 && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <ShieldCheck className="w-3 h-3" />
                Valid Session
              </span>
            )}
          </div>
        </div>

        {/* Session Validation Checklist */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className={`flex items-center gap-1.5 p-2 rounded ${sessionValidation.hasToken ? 'bg-green-500/10 text-green-400' : 'bg-muted/30 text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${sessionValidation.hasToken ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
            aura.token
          </div>
          <div className={`flex items-center gap-1.5 p-2 rounded ${sessionValidation.hasFwuid ? 'bg-green-500/10 text-green-400' : 'bg-muted/30 text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${sessionValidation.hasFwuid ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
            fwuid
          </div>
          <div className={`flex items-center gap-1.5 p-2 rounded ${sessionValidation.hasSid ? 'bg-green-500/10 text-green-400' : 'bg-muted/30 text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${sessionValidation.hasSid ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
            sid cookie
          </div>
          <div className={`flex items-center gap-1.5 p-2 rounded ${sessionValidation.hasCookies ? 'bg-green-500/10 text-green-400' : 'bg-muted/30 text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${sessionValidation.hasCookies ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
            Cookies
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cookies" className="text-xs text-muted-foreground">
            Session Cookies (paste from browser DevTools)
          </Label>
          <Textarea
            id="cookies"
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            className="font-mono text-xs bg-muted/50 border-border/50 min-h-[80px]"
            placeholder="sid=...; renderCtx=...; BrowserId=...; ..."
          />
          <p className="text-xs text-muted-foreground">
            Tip: Open DevTools → Network → copy Cookie header from any authenticated request
          </p>
        </div>
      </div>

      {/* Parameters */}
      <div className="glow-card rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Action Parameters</h3>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setParams(generateSampleParams(action.parameters))}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>

        <CodeEditor
          value={JSON.stringify(params, null, 2)}
          onChange={(val) => {
            try {
              setParams(JSON.parse(val));
            } catch {
              // Invalid JSON, ignore
            }
          }}
          language="json"
          minHeight="120px"
        />
      </div>

      {/* Output */}
      <Tabs defaultValue="payload" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="payload" className="text-xs">Payload</TabsTrigger>
          <TabsTrigger value="context" className="text-xs">Context</TabsTrigger>
          <TabsTrigger value="raw" className="text-xs">Raw HTTP</TabsTrigger>
          <TabsTrigger value="curl" className="text-xs">cURL</TabsTrigger>
          <TabsTrigger value="burp" className="text-xs">Burp</TabsTrigger>
        </TabsList>

        <TabsContent value="payload" className="space-y-2">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => copyToClipboard(JSON.stringify(payload, null, 2), 'Payload')}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
          <CodeEditor
            value={JSON.stringify(payload, null, 2)}
            onChange={() => {}}
            language="json"
            readOnly
            minHeight="200px"
          />
        </TabsContent>

        <TabsContent value="context" className="space-y-2">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => copyToClipboard(JSON.stringify(context, null, 2), 'Context')}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
          <CodeEditor
            value={JSON.stringify(context, null, 2)}
            onChange={() => {}}
            language="json"
            readOnly
            minHeight="200px"
          />
        </TabsContent>

        <TabsContent value="raw" className="space-y-2">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => request && copyToClipboard(formatAsBurp(request), 'Raw request')}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
          <CodeEditor
            value={request ? formatAsBurp(request) : ''}
            onChange={() => {}}
            language="http"
            readOnly
            minHeight="300px"
          />
        </TabsContent>

        <TabsContent value="curl" className="space-y-2">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => request && copyToClipboard(formatAsCurl(request), 'cURL command')}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
          <CodeEditor
            value={request ? formatAsCurl(request) : ''}
            onChange={() => {}}
            language="http"
            readOnly
            minHeight="250px"
          />
        </TabsContent>

        <TabsContent value="burp" className="space-y-2">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => request && copyToClipboard(formatAsBurp(request), 'Burp request')}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
          <CodeEditor
            value={request ? formatAsBurp(request) : ''}
            onChange={() => {}}
            language="http"
            readOnly
            minHeight="300px"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
