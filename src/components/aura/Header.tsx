import { Zap, Github, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center neon-border">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">
              <span className="neon-text">Aura</span>
              <span className="text-foreground">Scanner</span>
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Salesforce Security Toolkit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">v1.0</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">Source</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
