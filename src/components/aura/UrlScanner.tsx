import { useState } from 'react';
import { Globe, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { scanUrl } from '@/lib/api/scanner';
import type { ScanResult } from '@/lib/aura/types';
import { toast } from 'sonner';

interface UrlScannerProps {
  onScanComplete: (result: ScanResult) => void;
}

export function UrlScanner({ onScanComplete }: UrlScannerProps) {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    setIsScanning(true);
    setError(null);

    try {
      const result = await scanUrl(normalizedUrl);
      onScanComplete(result);
      
      if (result.rawMatches > 0) {
        toast.success(`Found ${result.rawMatches} Aura action${result.rawMatches !== 1 ? 's' : ''}`);
      } else {
        toast.warning('No Aura actions found on this page');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan URL';
      setError(message);
      toast.error(message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="glow-card rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">URL Scanner</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Enter a Salesforce URL to scan for exposed Aura actions. The scanner will fetch the page and any linked JavaScript files.
      </p>

      <div className="space-y-2">
        <Label htmlFor="scanUrl" className="text-xs text-muted-foreground">
          Target URL
        </Label>
        <div className="flex gap-2">
          <Input
            id="scanUrl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.salesforce.com"
            className="font-mono text-sm bg-muted/50 border-border/50 flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          />
          <Button
            onClick={handleScan}
            disabled={isScanning || !url.trim()}
            className="gap-2 min-w-[120px]"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Scan URL
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-destructive font-medium">Scan Failed</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      <div className="border-t border-border/30 pt-4 mt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ExternalLink className="w-3 h-3" />
          <span>
            Note: This scanner fetches HTML and linked JS files. For pages with heavy JavaScript rendering, 
            paste the source directly for better results.
          </span>
        </div>
      </div>
    </div>
  );
}
