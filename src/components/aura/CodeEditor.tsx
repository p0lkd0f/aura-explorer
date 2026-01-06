import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: 'javascript' | 'json' | 'http';
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  placeholder = 'Paste code here...',
  language = 'javascript',
  readOnly = false,
  minHeight = '200px',
  className,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([1]);

  useEffect(() => {
    const lines = value.split('\n').length;
    setLineNumbers(Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1));
  }, [value]);

  return (
    <div
      className={cn(
        'relative rounded-lg border border-border/50 bg-[hsl(220,25%,5%)] overflow-hidden',
        'focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20',
        className
      )}
      style={{ minHeight }}
    >
      {/* Line numbers */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted/30 border-r border-border/30 overflow-hidden">
        <div className="py-3 text-right pr-2 font-mono text-xs text-muted-foreground/50 select-none">
          {lineNumbers.map((num) => (
            <div key={num} className="h-5 leading-5">
              {num}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck={false}
        className={cn(
          'w-full h-full pl-14 pr-4 py-3 font-mono text-sm',
          'bg-transparent text-foreground resize-none outline-none',
          'placeholder:text-muted-foreground/40',
          readOnly && 'cursor-default'
        )}
        style={{ minHeight }}
      />

      {/* Language badge */}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-mono text-muted-foreground bg-muted/50">
        {language}
      </div>
    </div>
  );
}
