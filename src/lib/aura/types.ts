// ============================================
// PARAMETER TYPES
// ============================================

export interface ActionParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  inferredFrom?: 'known' | 'context' | 'signature';
}

// ============================================
// ACTION TYPES
// ============================================

export type ActionCategory = 'system' | 'record' | 'apex' | 'ui' | 'community' | 'commerce' | 'data' | 'auth' | 'custom';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export interface AuraAction {
  name: string;
  controller: string;
  descriptor: string;
  returnType: string;
  parameters: ActionParameter[];
  category?: ActionCategory;
  riskLevel?: RiskLevel;
  description?: string;
  isKnown?: boolean;
  requiresAuth?: boolean;
}

export interface AuraController {
  name: string;
  actions: AuraAction[];
}

// ============================================
// PAYLOAD TYPES
// ============================================

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

// ============================================
// SESSION TYPES
// ============================================

export interface SessionCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
}

export interface GuestSession {
  cookies: SessionCookie[];
  rawCookieHeader: string;
  guestUserId?: string;
  sessionType: 'guest' | 'authenticated' | 'unknown';
}

export interface AuraSession {
  cookies: string;
  token: string;
  fwuid: string;
  app: string;
  isValid: boolean;
}

export interface SessionValidation {
  hasToken: boolean;
  hasFwuid: boolean;
  hasCookies: boolean;
  hasSid: boolean;
  hasRenderCtx: boolean;
  hasAuraContext: boolean;
}

// ============================================
// SCAN RESULT TYPES
// ============================================

export interface DetectedEndpoint {
  path: string;
  type: string;
}

export interface ScanMetadata {
  fwuid: string | null;
  app: string | null;
  token: string | null;
  scannedUrl?: string;
  apiVersion?: string;
  loadedComponents?: string[];
  detectedEndpoints?: DetectedEndpoint[];
  auraContext?: AuraContext;
}

export interface DetectedVulnerability {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  matchedPattern: string;
  recommendation: string;
  location?: string;
}

export interface ScanResult {
  success: boolean;
  rawMatches: number;
  controllers: AuraAction[];
  timestamp: Date;
  metadata?: ScanMetadata;
  guestSession?: GuestSession;
  vulnerabilities?: DetectedVulnerability[];
  jsFilesScanned?: number;
  pageSize?: number;
  scanDuration?: number;
  warnings?: string[];
}

// ============================================
// KNOWN CONTROLLER TYPES
// ============================================

export interface KnownActionDefinition {
  params: { name: string; type: string; required: boolean; description: string }[];
  returnType: string;
  riskLevel: RiskLevel;
  description: string;
}

export interface KnownControllerDefinition {
  description: string;
  category: ActionCategory;
  riskLevel: RiskLevel;
  actions: Record<string, KnownActionDefinition>;
}
