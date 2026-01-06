import { Search, Zap, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ActionCard } from './ActionCard';
import type { AuraAction, ScanResult } from '@/lib/aura/types';
import { useState, useMemo } from 'react';

interface ScanResultsProps {
  result: ScanResult | null;
  isScanning: boolean;
  onBuildPayload: (action: AuraAction) => void;
}

export function ScanResults({ result, isScanning, onBuildPayload }: ScanResultsProps) {
  const [filter, setFilter] = useState('');

  const filteredActions = useMemo(() => {
    if (!result?.controllers) return [];
    if (!filter) return result.controllers;
    
    const lowerFilter = filter.toLowerCase();
    return result.controllers.filter(
      (a) =>
        a.name.toLowerCase().includes(lowerFilter) ||
        a.controller.toLowerCase().includes(lowerFilter)
    );
  }, [result, filter]);

  // Group by controller
  const groupedActions = useMemo(() => {
    const groups: Record<string, AuraAction[]> = {};
    for (const action of filteredActions) {
      if (!groups[action.controller]) {
        groups[action.controller] = [];
      }
      groups[action.controller].push(action);
    }
    return groups;
  }, [filteredActions]);

  if (isScanning) {
    return (
      <div className="glow-card rounded-lg p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-pulse">
          <Zap className="w-8 h-8 text-primary animate-glow-pulse" />
        </div>
        <p className="text-muted-foreground">Scanning for Aura actions...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glow-card rounded-lg p-12 text-center">
        <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          Paste JavaScript code to scan for Aura actions
        </p>
      </div>
    );
  }

  if (result.controllers.length === 0) {
    return (
      <div className="glow-card rounded-lg p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-yellow-500/50 mb-4" />
        <p className="text-muted-foreground">No Aura actions found in the provided code</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Actions:</span>
            <span className="neon-text font-mono font-bold">{result.rawMatches}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Controllers:</span>
            <span className="neon-green-text font-mono font-bold">
              {Object.keys(groupedActions).length}
            </span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {result.timestamp.toLocaleTimeString()}
        </div>
      </div>

      {/* Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Filter actions..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10 bg-muted/50 border-border/50"
        />
      </div>

      {/* Results */}
      <div className="space-y-6">
        {Object.entries(groupedActions).map(([controller, actions]) => (
          <div key={controller} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <h3 className="font-mono text-sm text-accent">{controller}</h3>
              <span className="text-xs text-muted-foreground">
                ({actions.length} action{actions.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="space-y-2 pl-4">
              {actions.map((action, idx) => (
                <ActionCard
                  key={`${action.controller}-${action.name}-${idx}`}
                  action={action}
                  onBuildPayload={onBuildPayload}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
