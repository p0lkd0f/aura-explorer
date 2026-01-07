export interface AuraAction {
  name: string;
  controller: string;
  descriptor: string;
  returnType: string;
  parameters: { name: string; type: string }[];
}

export interface AuraController {
  name: string;
  actions: AuraAction[];
}

export interface AuraPayload {
  actions: {
    id: string;
    descriptor: string;
    callingDescriptor: string;
    params: Record<string, unknown>;
    cacheable?: boolean;
    isContinuation?: boolean;
  }[];
}

export interface AuraContext {
  mode: string;
  fwuid: string;
  app: string;
  loaded: Record<string, string>;
  dn: string[];
  globals: Record<string, unknown>;
  uad: boolean;
}

export interface FullHttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

export interface ScanMetadata {
  fwuid: string | null;
  app: string | null;
  token: string | null;
  scannedUrl?: string;
}

export interface ScanResult {
  success: boolean;
  rawMatches: number;
  controllers: AuraAction[];
  timestamp: Date;
  metadata?: ScanMetadata;
}
