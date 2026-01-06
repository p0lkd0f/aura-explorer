import { supabase } from '@/integrations/supabase/client';
import type { AuraAction, ScanResult } from '@/lib/aura/types';

export interface UrlScanResponse {
  success: boolean;
  rawMatches: number;
  controllers: AuraAction[];
  metadata?: {
    fwuid: string | null;
    app: string | null;
    token: string | null;
  };
  jsFilesScanned?: number;
  pageSize?: number;
  error?: string;
}

export async function scanUrl(url: string): Promise<ScanResult> {
  const { data, error } = await supabase.functions.invoke<UrlScanResponse>('scan-url', {
    body: { url },
  });

  if (error) {
    throw new Error(error.message || 'Failed to scan URL');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Scan failed');
  }

  return {
    success: true,
    rawMatches: data.rawMatches,
    controllers: data.controllers,
    timestamp: new Date(),
  };
}
