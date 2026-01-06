import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Play, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AuraAction } from '@/lib/aura/types';
import { toast } from 'sonner';

interface ActionCardProps {
  action: AuraAction;
  onBuildPayload: (action: AuraAction) => void;
}

export function ActionCard({ action, onBuildPayload }: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const copyDescriptor = () => {
    navigator.clipboard.writeText(action.descriptor);
    toast.success('Descriptor copied to clipboard');
  };

  return (
    <div className="glow-card rounded-lg overflow-hidden transition-all hover:border-primary/50">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm neon-text">{action.name}</span>
              {action.parameters.length === 0 && (
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
              )}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {action.controller}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              copyDescriptor();
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onBuildPayload(action);
            }}
          >
            <Play className="w-3 h-3" />
            Build
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border/30 pt-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Descriptor:</span>
              <code className="font-mono text-primary/80 bg-muted/50 px-2 py-0.5 rounded">
                {action.descriptor}
              </code>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Return Type:</span>
              <span className="font-mono text-accent">{action.returnType}</span>
            </div>

            {action.parameters.length > 0 ? (
              <div className="mt-3">
                <span className="text-xs text-muted-foreground">Parameters:</span>
                <div className="mt-1 grid gap-1">
                  {action.parameters.map((param, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs font-mono bg-muted/30 rounded px-2 py-1"
                    >
                      <span className="text-foreground">{param.name}</span>
                      <span className="text-muted-foreground">:</span>
                      <span className="text-accent">{param.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-yellow-500/80 mt-2">
                ⚠ No parameters detected - may require manual configuration
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
