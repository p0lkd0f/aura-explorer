import { supabase } from '@/integrations/supabase/client';
import type { AuraAction, ScanResult, ScanMetadata, GuestSession, DetectedEndpoint, AuraContext, ActionParameter, DetectedVulnerability } from '@/lib/aura/types';

// Response type matching the enhanced edge function
export interface UrlScanResponse {
  success: boolean;
  rawMatches: number;
  controllers: {
    name: string;
    controller: string;
    descriptor: string;
    returnType: string;
    parameters: ActionParameter[];
    category?: string;
    riskLevel?: string;
    description?: string;
    isKnown?: boolean;
    requiresAuth?: boolean;
  }[];
  metadata?: {
    fwuid: string | null;
    app: string | null;
    token: string | null;
    scannedUrl?: string;
    apiVersion?: string;
    loadedComponents?: string[];
    detectedEndpoints?: DetectedEndpoint[];
    auraContext?: AuraContext;
  };
  guestSession?: {
    cookies: {
      name: string;
      value: string;
      domain: string;
      path: string;
      secure: boolean;
      httpOnly: boolean;
    }[];
    rawCookieHeader: string;
    guestUserId?: string;
    sessionType: 'guest' | 'authenticated' | 'unknown';
  };
  vulnerabilities?: DetectedVulnerability[];
  jsFilesScanned?: number;
  pageSize?: number;
  scanDuration?: number;
  warnings?: string[];
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

  // Transform controllers to AuraAction format
  const controllers: AuraAction[] = data.controllers.map(c => ({
    name: c.name,
    controller: c.controller,
    descriptor: c.descriptor,
    returnType: c.returnType,
    parameters: c.parameters || [],
    category: c.category as AuraAction['category'],
    riskLevel: c.riskLevel as AuraAction['riskLevel'],
    description: c.description,
    isKnown: c.isKnown,
    requiresAuth: c.requiresAuth,
  }));

  // Transform metadata
  const metadata: ScanMetadata | undefined = data.metadata ? {
    fwuid: data.metadata.fwuid,
    app: data.metadata.app,
    token: data.metadata.token,
    scannedUrl: data.metadata.scannedUrl || url,
    apiVersion: data.metadata.apiVersion,
    loadedComponents: data.metadata.loadedComponents,
    detectedEndpoints: data.metadata.detectedEndpoints,
    auraContext: data.metadata.auraContext,
  } : undefined;

  // Transform guest session
  const guestSession: GuestSession | undefined = data.guestSession ? {
    cookies: data.guestSession.cookies,
    rawCookieHeader: data.guestSession.rawCookieHeader,
    guestUserId: data.guestSession.guestUserId,
    sessionType: data.guestSession.sessionType,
  } : undefined;

  return {
    success: true,
    rawMatches: data.rawMatches,
    controllers,
    timestamp: new Date(),
    metadata,
    guestSession,
    vulnerabilities: data.vulnerabilities,
    jsFilesScanned: data.jsFilesScanned,
    pageSize: data.pageSize,
    scanDuration: data.scanDuration,
    warnings: data.warnings,
  };
}
