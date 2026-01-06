import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/aura/Header';
import { CodeEditor } from '@/components/aura/CodeEditor';
import { ScanResults } from '@/components/aura/ScanResults';
import { PayloadBuilder } from '@/components/aura/PayloadBuilder';
import { parseAuraActions, extractFwuid, extractAppName } from '@/lib/aura/parser';
import type { AuraAction, ScanResult } from '@/lib/aura/types';
import { Scan, Code2, FileCode, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const SAMPLE_JS = `// Sample Salesforce Aura JavaScript
var actions = {
  "aura://RecordUiController/ACTION$getRecordWithFields": true,
  "aura://ApexActionController/ACTION$execute": true,
  "apex://CustomController/ACTION$getData": true,
  "aura://RecordUiController/ACTION$getRecordCreateDefaults": true
};

// More complex example
$A.getCallback(function() {
  var action = cmp.get("c.aura://UserController/ACTION$getCurrentUser");
  action.setParams({userId: "005xxx"});
});
`;

export default function Index() {
  const [jsCode, setJsCode] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AuraAction | null>(null);
  const [activeTab, setActiveTab] = useState('scanner');

  const handleScan = async () => {
    if (!jsCode.trim()) {
      toast.error('Please paste JavaScript code to scan');
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setSelectedAction(null);

    // Simulate async processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const actions = parseAuraActions(jsCode);
      const fwuid = extractFwuid(jsCode);
      const app = extractAppName(jsCode);

      setScanResult({
        success: true,
        rawMatches: actions.length,
        controllers: actions,
        timestamp: new Date(),
      });

      if (actions.length > 0) {
        toast.success(`Found ${actions.length} Aura action${actions.length !== 1 ? 's' : ''}`);
      } else {
        toast.warning('No Aura actions found');
      }
    } catch (error) {
      toast.error('Failed to parse JavaScript');
    } finally {
      setIsScanning(false);
    }
  };

  const handleBuildPayload = (action: AuraAction) => {
    setSelectedAction(action);
    setActiveTab('builder');
    toast.success(`Building payload for ${action.name}`);
  };

  const loadSample = () => {
    setJsCode(SAMPLE_JS);
    toast.info('Sample code loaded');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 grid-pattern opacity-50 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <Header />

      <main className="container mx-auto px-6 py-8 relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="scanner" className="gap-2">
                <Scan className="w-4 h-4" />
                Scanner
              </TabsTrigger>
              <TabsTrigger value="builder" className="gap-2">
                <Code2 className="w-4 h-4" />
                Payload Builder
              </TabsTrigger>
            </TabsList>

            {activeTab === 'scanner' && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={loadSample} className="gap-2">
                  <FileCode className="w-4 h-4" />
                  Load Sample
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="scanner" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Panel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    JavaScript Input
                  </h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    {jsCode.length.toLocaleString()} chars
                  </span>
                </div>

                <CodeEditor
                  value={jsCode}
                  onChange={setJsCode}
                  placeholder="Paste Salesforce JavaScript code here..."
                  language="javascript"
                  minHeight="400px"
                />

                <Button
                  onClick={handleScan}
                  disabled={isScanning || !jsCode.trim()}
                  className="w-full gap-2 neon-border"
                  size="lg"
                >
                  {isScanning ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4" />
                      Scan for Aura Actions
                    </>
                  )}
                </Button>
              </div>

              {/* Results Panel */}
              <div className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Discovered Actions
                </h2>

                <div className="min-h-[400px]">
                  <ScanResults
                    result={scanResult}
                    isScanning={isScanning}
                    onBuildPayload={handleBuildPayload}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                {selectedAction ? (
                  <span>
                    Building: <span className="neon-text">{selectedAction.name}</span>
                  </span>
                ) : (
                  'Payload Builder'
                )}
              </h2>

              <PayloadBuilder action={selectedAction} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-16 py-6">
        <div className="container mx-auto px-6 text-center text-xs text-muted-foreground">
          <p>
            Built for security research and authorized penetration testing only.
          </p>
          <p className="mt-1 opacity-60">
            Use responsibly. Unauthorized access to computer systems is illegal.
          </p>
        </div>
      </footer>
    </div>
  );
}
