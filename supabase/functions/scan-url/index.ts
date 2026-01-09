import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// KNOWN SALESFORCE ENDPOINTS & CONTROLLERS
// ============================================

const KNOWN_AURA_CONTROLLERS: Record<string, {
  description: string;
  category: 'system' | 'record' | 'apex' | 'ui' | 'community' | 'commerce' | 'data' | 'auth';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  actions: Record<string, {
    params: { name: string; type: string; required: boolean; description: string }[];
    returnType: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
}> = {
  // Record UI Controllers
  'RecordUiController': {
    description: 'Record UI operations - view, create, update records',
    category: 'record',
    riskLevel: 'medium',
    actions: {
      'getRecordWithFields': {
        params: [
          { name: 'recordId', type: 'Id', required: true, description: 'Salesforce record ID' },
          { name: 'fields', type: 'List<String>', required: true, description: 'Fields to retrieve' }
        ],
        returnType: 'RecordUiResponse',
        riskLevel: 'medium',
        description: 'Get record data with specified fields'
      },
      'getRecordCreateDefaults': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'Object API name' },
          { name: 'recordTypeId', type: 'Id', required: false, description: 'Record type ID' }
        ],
        returnType: 'RecordDefaults',
        riskLevel: 'low',
        description: 'Get default values for new record creation'
      },
      'getRecordUi': {
        params: [
          { name: 'recordIds', type: 'List<Id>', required: true, description: 'List of record IDs' },
          { name: 'layoutTypes', type: 'List<String>', required: false, description: 'Layout types to retrieve' },
          { name: 'modes', type: 'List<String>', required: false, description: 'View/Edit modes' }
        ],
        returnType: 'RecordUiResponse',
        riskLevel: 'medium',
        description: 'Get full record UI data including layouts'
      },
      'getObjectInfo': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'Object API name' }
        ],
        returnType: 'ObjectInfo',
        riskLevel: 'low',
        description: 'Get object metadata and field definitions'
      },
      'updateRecord': {
        params: [
          { name: 'recordId', type: 'Id', required: true, description: 'Record to update' },
          { name: 'fields', type: 'Map<String, Object>', required: true, description: 'Field values to update' }
        ],
        returnType: 'RecordUiResponse',
        riskLevel: 'high',
        description: 'Update record fields'
      },
      'createRecord': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'Object API name' },
          { name: 'fields', type: 'Map<String, Object>', required: true, description: 'Field values' }
        ],
        returnType: 'RecordUiResponse',
        riskLevel: 'high',
        description: 'Create new record'
      },
      'deleteRecord': {
        params: [
          { name: 'recordId', type: 'Id', required: true, description: 'Record to delete' }
        ],
        returnType: 'Boolean',
        riskLevel: 'critical',
        description: 'Delete a record'
      }
    }
  },
  // Apex Action Controller
  'ApexActionController': {
    description: 'Execute custom Apex methods marked with @AuraEnabled',
    category: 'apex',
    riskLevel: 'critical',
    actions: {
      'execute': {
        params: [
          { name: 'namespace', type: 'String', required: false, description: 'Apex namespace' },
          { name: 'classname', type: 'String', required: true, description: 'Apex class name' },
          { name: 'method', type: 'String', required: true, description: 'Method name' },
          { name: 'params', type: 'Map<String, Object>', required: false, description: 'Method parameters' },
          { name: 'cacheable', type: 'Boolean', required: false, description: 'Cache response' }
        ],
        returnType: 'Object',
        riskLevel: 'critical',
        description: 'Execute @AuraEnabled Apex method'
      }
    }
  },
  // List UI Controller
  'ListUiController': {
    description: 'List view operations',
    category: 'ui',
    riskLevel: 'medium',
    actions: {
      'getListUi': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'Object API name' },
          { name: 'listViewApiName', type: 'String', required: false, description: 'List view name' },
          { name: 'pageSize', type: 'Integer', required: false, description: 'Records per page' },
          { name: 'pageToken', type: 'String', required: false, description: 'Pagination token' }
        ],
        returnType: 'ListUiResponse',
        riskLevel: 'medium',
        description: 'Get list view UI data'
      },
      'getListsByObjectName': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'Object API name' }
        ],
        returnType: 'List<ListView>',
        riskLevel: 'low',
        description: 'Get available list views for object'
      }
    }
  },
  // Lookup Controller
  'LookupController': {
    description: 'Lookup field search operations',
    category: 'ui',
    riskLevel: 'medium',
    actions: {
      'getRecordTypeInfos': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'Object API name' }
        ],
        returnType: 'List<RecordTypeInfo>',
        riskLevel: 'low',
        description: 'Get record types for object'
      },
      'search': {
        params: [
          { name: 'searchTerm', type: 'String', required: true, description: 'Search query' },
          { name: 'objectApiName', type: 'String', required: true, description: 'Object to search' },
          { name: 'fieldApiName', type: 'String', required: false, description: 'Field to search' },
          { name: 'maxResults', type: 'Integer', required: false, description: 'Max results' }
        ],
        returnType: 'List<LookupResult>',
        riskLevel: 'medium',
        description: 'Search for lookup values'
      }
    }
  },
  // ActionsController
  'ActionsController': {
    description: 'Quick actions and global actions',
    category: 'ui',
    riskLevel: 'high',
    actions: {
      'getActions': {
        params: [
          { name: 'recordId', type: 'Id', required: false, description: 'Record ID for context' },
          { name: 'objectApiName', type: 'String', required: false, description: 'Object API name' }
        ],
        returnType: 'List<Action>',
        riskLevel: 'low',
        description: 'Get available actions'
      },
      'invokeAction': {
        params: [
          { name: 'actionApiName', type: 'String', required: true, description: 'Action to invoke' },
          { name: 'recordId', type: 'Id', required: false, description: 'Record context' },
          { name: 'params', type: 'Map<String, Object>', required: false, description: 'Action params' }
        ],
        returnType: 'ActionResult',
        riskLevel: 'high',
        description: 'Invoke a quick action'
      }
    }
  },
  // Navigation Controller
  'NavigationController': {
    description: 'Navigation and URL generation',
    category: 'system',
    riskLevel: 'low',
    actions: {
      'generateUrl': {
        params: [
          { name: 'pageReference', type: 'PageReference', required: true, description: 'Page reference object' }
        ],
        returnType: 'String',
        riskLevel: 'low',
        description: 'Generate URL from page reference'
      }
    }
  },
  // Community Controllers
  'CommunityNavigationController': {
    description: 'Experience Cloud navigation',
    category: 'community',
    riskLevel: 'low',
    actions: {
      'getNavigationMenuItems': {
        params: [
          { name: 'menuName', type: 'String', required: true, description: 'Navigation menu name' },
          { name: 'publishedState', type: 'String', required: false, description: 'Published state filter' }
        ],
        returnType: 'List<NavigationMenuItem>',
        riskLevel: 'low',
        description: 'Get navigation menu items'
      }
    }
  },
  'CommunityLoginController': {
    description: 'Community/Experience Cloud login',
    category: 'auth',
    riskLevel: 'high',
    actions: {
      'login': {
        params: [
          { name: 'username', type: 'String', required: true, description: 'Username' },
          { name: 'password', type: 'String', required: true, description: 'Password' },
          { name: 'startUrl', type: 'String', required: false, description: 'Redirect URL after login' }
        ],
        returnType: 'LoginResult',
        riskLevel: 'critical',
        description: 'Authenticate user'
      },
      'getSelfRegisterUrl': {
        params: [],
        returnType: 'String',
        riskLevel: 'low',
        description: 'Get self-registration URL'
      },
      'getForgotPasswordUrl': {
        params: [],
        returnType: 'String',
        riskLevel: 'low',
        description: 'Get forgot password URL'
      }
    }
  },
  // SOQL/Data Controller
  'WireAdapter': {
    description: 'Wire service data adapter',
    category: 'data',
    riskLevel: 'high',
    actions: {
      'query': {
        params: [
          { name: 'query', type: 'String', required: true, description: 'SOQL query string' }
        ],
        returnType: 'QueryResult',
        riskLevel: 'critical',
        description: 'Execute SOQL query'
      }
    }
  },
  // Commerce Controllers
  'CartController': {
    description: 'B2B/B2C Commerce cart operations',
    category: 'commerce',
    riskLevel: 'high',
    actions: {
      'getCart': {
        params: [
          { name: 'cartId', type: 'Id', required: false, description: 'Cart ID' },
          { name: 'effectiveAccountId', type: 'Id', required: false, description: 'Account context' }
        ],
        returnType: 'Cart',
        riskLevel: 'medium',
        description: 'Get cart details'
      },
      'addToCart': {
        params: [
          { name: 'productId', type: 'Id', required: true, description: 'Product to add' },
          { name: 'quantity', type: 'Integer', required: true, description: 'Quantity' },
          { name: 'cartId', type: 'Id', required: false, description: 'Cart ID' }
        ],
        returnType: 'CartItem',
        riskLevel: 'medium',
        description: 'Add item to cart'
      },
      'updateCartItem': {
        params: [
          { name: 'cartItemId', type: 'Id', required: true, description: 'Cart item ID' },
          { name: 'quantity', type: 'Integer', required: true, description: 'New quantity' }
        ],
        returnType: 'CartItem',
        riskLevel: 'medium',
        description: 'Update cart item quantity'
      },
      'deleteCartItem': {
        params: [
          { name: 'cartItemId', type: 'Id', required: true, description: 'Cart item to remove' }
        ],
        returnType: 'Boolean',
        riskLevel: 'medium',
        description: 'Remove item from cart'
      },
      'checkout': {
        params: [
          { name: 'cartId', type: 'Id', required: true, description: 'Cart to checkout' }
        ],
        returnType: 'CheckoutResult',
        riskLevel: 'high',
        description: 'Initiate checkout process'
      }
    }
  },
  'ProductController': {
    description: 'Commerce product operations',
    category: 'commerce',
    riskLevel: 'medium',
    actions: {
      'getProduct': {
        params: [
          { name: 'productId', type: 'Id', required: true, description: 'Product ID' }
        ],
        returnType: 'Product',
        riskLevel: 'low',
        description: 'Get product details'
      },
      'searchProducts': {
        params: [
          { name: 'searchTerm', type: 'String', required: true, description: 'Search query' },
          { name: 'categoryId', type: 'Id', required: false, description: 'Category filter' },
          { name: 'pageSize', type: 'Integer', required: false, description: 'Results per page' }
        ],
        returnType: 'ProductSearchResult',
        riskLevel: 'low',
        description: 'Search products'
      }
    }
  },
  // Chatter Controller
  'ChatterController': {
    description: 'Chatter feed operations',
    category: 'ui',
    riskLevel: 'medium',
    actions: {
      'getFeed': {
        params: [
          { name: 'feedType', type: 'String', required: true, description: 'Feed type (News, Record, etc.)' },
          { name: 'subjectId', type: 'Id', required: false, description: 'Subject record ID' }
        ],
        returnType: 'ChatterFeed',
        riskLevel: 'medium',
        description: 'Get Chatter feed'
      },
      'postFeedElement': {
        params: [
          { name: 'subjectId', type: 'Id', required: true, description: 'Feed subject' },
          { name: 'text', type: 'String', required: true, description: 'Post content' }
        ],
        returnType: 'FeedElement',
        riskLevel: 'high',
        description: 'Create feed post'
      }
    }
  },
  // Content/File Controller
  'ContentController': {
    description: 'Content document operations',
    category: 'data',
    riskLevel: 'high',
    actions: {
      'getContentDocumentLink': {
        params: [
          { name: 'contentDocumentId', type: 'Id', required: true, description: 'Document ID' }
        ],
        returnType: 'ContentDocumentLink',
        riskLevel: 'medium',
        description: 'Get document link'
      },
      'uploadFile': {
        params: [
          { name: 'base64Data', type: 'String', required: true, description: 'File content (base64)' },
          { name: 'fileName', type: 'String', required: true, description: 'File name' },
          { name: 'recordId', type: 'Id', required: false, description: 'Parent record' }
        ],
        returnType: 'ContentVersion',
        riskLevel: 'high',
        description: 'Upload file attachment'
      },
      'deleteFile': {
        params: [
          { name: 'contentDocumentId', type: 'Id', required: true, description: 'Document to delete' }
        ],
        returnType: 'Boolean',
        riskLevel: 'critical',
        description: 'Delete content document'
      }
    }
  }
};

// Known Salesforce API Endpoints
const KNOWN_ENDPOINTS = [
  { path: '/s/sfsites/aura', description: 'Aura Framework endpoint', type: 'aura' },
  { path: '/aura', description: 'Classic Aura endpoint', type: 'aura' },
  { path: '/services/data/', description: 'REST API', type: 'rest' },
  { path: '/services/apexrest/', description: 'Apex REST', type: 'apex-rest' },
  { path: '/services/Soap/', description: 'SOAP API', type: 'soap' },
  { path: '/services/async/', description: 'Bulk API', type: 'bulk' },
  { path: '/cometd/', description: 'Streaming API', type: 'streaming' },
  { path: '/connect/', description: 'Connect API', type: 'connect' },
];

// ============================================
// PATTERN MATCHING
// ============================================

const AURA_DESCRIPTOR_PATTERN = /aura:\/\/([^/]+)\/ACTION\$([A-Za-z0-9_]+)/g;
const APEX_CONTROLLER_PATTERN = /apex:\/\/([^/]+)\/ACTION\$([A-Za-z0-9_]+)/g;
const SERVICE_COMPONENT_PATTERN = /serviceComponent:\/\/ui\.([^.]+)\.([A-Za-z0-9_]+)/g;
const MARKUP_PATTERN = /markup:\/\/([^:]+):([A-Za-z0-9_]+)/g;
const COMPONENT_DEF_PATTERN = /componentDef\s*:\s*["']([^"']+)["']/g;
const CONTROLLER_DEF_PATTERN = /controllerDef\s*:\s*\{[^}]*name\s*:\s*["']([^"']+)["']/g;

// Parameter inference patterns
const SET_PARAMS_PATTERN = /\.setParams?\s*\(\s*\{([^}]+)\}/g;
const PARAM_KEY_PATTERN = /["']?(\w+)["']?\s*:\s*([^,}]+)/g;
const APEX_PARAM_PATTERN = /@AuraEnabled[^)]*\)\s*(?:public|global)\s+\w+\s+(\w+)\s*\(([^)]*)\)/g;
const METHOD_SIGNATURE_PATTERN = /function\s+(\w+)\s*\(([^)]*)\)/g;

// Session/Token patterns
const AURA_TOKEN_PATTERNS = [
  /aura\.token\s*=\s*["']([^"']+)["']/,
  /"aura\.token"\s*:\s*"([^"]+)"/,
  /token:\s*["']([^"']+)["']/,
];

const FWUID_PATTERNS = [
  /"fwuid"\s*:\s*"([^"]+)"/,
  /fwuid\s*:\s*["']([^"']+)["']/,
];

const APP_PATTERNS = [
  /"app"\s*:\s*"([^"]+)"/,
  /app\s*:\s*["']([^"']+)["']/,
];

// ============================================
// INTERFACES
// ============================================

interface ActionParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  inferredFrom?: 'known' | 'context' | 'signature';
}

interface EnrichedAuraAction {
  name: string;
  controller: string;
  descriptor: string;
  returnType: string;
  parameters: ActionParameter[];
  category: 'system' | 'record' | 'apex' | 'ui' | 'community' | 'commerce' | 'data' | 'auth' | 'custom';
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  description: string;
  isKnown: boolean;
  requiresAuth: boolean;
}

interface GuestSession {
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
}

interface AuraContext {
  mode: string;
  fwuid: string;
  app: string;
  loaded: Record<string, string>;
  dn: string[];
  globals: Record<string, unknown>;
  uad: boolean;
}

interface ScanMetadata {
  fwuid: string | null;
  app: string | null;
  token: string | null;
  scannedUrl: string;
  apiVersion?: string;
  loadedComponents: string[];
  detectedEndpoints: { path: string; type: string }[];
  auraContext?: AuraContext;
}

interface AdvancedScanResult {
  success: boolean;
  rawMatches: number;
  controllers: EnrichedAuraAction[];
  metadata: ScanMetadata;
  guestSession: GuestSession;
  jsFilesScanned: number;
  pageSize: number;
  scanDuration: number;
  warnings: string[];
}

// ============================================
// PARSING FUNCTIONS
// ============================================

function inferParameterType(value: string): string {
  value = value.trim();
  
  if (value === 'true' || value === 'false') return 'Boolean';
  if (/^\d+$/.test(value)) return 'Integer';
  if (/^\d+\.\d+$/.test(value)) return 'Decimal';
  if (/^["'].*["']$/.test(value)) return 'String';
  if (/^\[/.test(value)) return 'List<Object>';
  if (/^\{/.test(value)) return 'Map<String, Object>';
  if (/recordId|Id$/i.test(value)) return 'Id';
  if (/\.(\w+)$/.test(value)) return 'Reference';
  
  return 'Object';
}

function extractParametersFromContext(content: string, actionName: string): ActionParameter[] {
  const params: ActionParameter[] = [];
  const seen = new Set<string>();
  
  // Look for setParams calls near this action
  const contextPattern = new RegExp(
    `${actionName}[\\s\\S]{0,1000}setParams?\\s*\\(\\s*\\{([^}]+)\\}`,
    'gi'
  );
  
  let match;
  while ((match = contextPattern.exec(content)) !== null) {
    const paramsStr = match[1];
    let keyMatch;
    PARAM_KEY_PATTERN.lastIndex = 0;
    
    while ((keyMatch = PARAM_KEY_PATTERN.exec(paramsStr)) !== null) {
      const paramName = keyMatch[1];
      if (!seen.has(paramName)) {
        seen.add(paramName);
        params.push({
          name: paramName,
          type: inferParameterType(keyMatch[2]),
          required: true,
          description: `Inferred parameter`,
          inferredFrom: 'context'
        });
      }
    }
  }
  
  return params;
}

function enrichAction(
  name: string, 
  controller: string, 
  descriptor: string,
  content: string
): EnrichedAuraAction {
  // Check if it's a known controller
  const knownController = KNOWN_AURA_CONTROLLERS[controller];
  const knownAction = knownController?.actions[name];
  
  if (knownAction) {
    return {
      name,
      controller,
      descriptor,
      returnType: knownAction.returnType,
      parameters: knownAction.params.map(p => ({
        ...p,
        inferredFrom: 'known' as const
      })),
      category: knownController.category,
      riskLevel: knownAction.riskLevel,
      description: knownAction.description,
      isKnown: true,
      requiresAuth: knownAction.riskLevel === 'high' || knownAction.riskLevel === 'critical'
    };
  }
  
  // Extract parameters from context for unknown actions
  const inferredParams = extractParametersFromContext(content, name);
  
  // Determine category based on naming conventions
  let category: EnrichedAuraAction['category'] = 'custom';
  let riskLevel: EnrichedAuraAction['riskLevel'] = 'unknown';
  let requiresAuth = true;
  
  const lowerName = name.toLowerCase();
  const lowerController = controller.toLowerCase();
  
  if (lowerName.includes('delete') || lowerName.includes('remove')) {
    riskLevel = 'critical';
  } else if (lowerName.includes('update') || lowerName.includes('save') || lowerName.includes('create') || lowerName.includes('insert')) {
    riskLevel = 'high';
  } else if (lowerName.includes('get') || lowerName.includes('fetch') || lowerName.includes('load') || lowerName.includes('read')) {
    riskLevel = 'medium';
  } else if (lowerName.includes('search') || lowerName.includes('find')) {
    riskLevel = 'medium';
  }
  
  if (lowerController.includes('login') || lowerController.includes('auth')) {
    category = 'auth';
  } else if (lowerController.includes('cart') || lowerController.includes('commerce') || lowerController.includes('product')) {
    category = 'commerce';
  } else if (lowerController.includes('community') || lowerController.includes('site')) {
    category = 'community';
  } else if (lowerController.includes('record') || lowerController.includes('sobject')) {
    category = 'record';
  }
  
  return {
    name,
    controller,
    descriptor,
    returnType: 'Object',
    parameters: inferredParams,
    category,
    riskLevel,
    description: `Custom Apex action: ${controller}.${name}`,
    isKnown: false,
    requiresAuth
  };
}

function parseAuraActionsAdvanced(content: string): EnrichedAuraAction[] {
  const actions: EnrichedAuraAction[] = [];
  const seen = new Set<string>();

  // Parse aura:// descriptors
  let match;
  AURA_DESCRIPTOR_PATTERN.lastIndex = 0;
  while ((match = AURA_DESCRIPTOR_PATTERN.exec(content)) !== null) {
    const key = `aura:${match[1]}:${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      actions.push(enrichAction(
        match[2],
        match[1],
        `aura://${match[1]}/ACTION$${match[2]}`,
        content
      ));
    }
  }

  // Parse apex:// descriptors
  APEX_CONTROLLER_PATTERN.lastIndex = 0;
  while ((match = APEX_CONTROLLER_PATTERN.exec(content)) !== null) {
    const key = `apex:${match[1]}:${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      actions.push(enrichAction(
        match[2],
        match[1],
        `apex://${match[1]}/ACTION$${match[2]}`,
        content
      ));
    }
  }

  // Parse serviceComponent:// patterns
  SERVICE_COMPONENT_PATTERN.lastIndex = 0;
  while ((match = SERVICE_COMPONENT_PATTERN.exec(content)) !== null) {
    const key = `svc:${match[1]}:${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      actions.push(enrichAction(
        match[2],
        match[1],
        `serviceComponent://ui.${match[1]}.${match[2]}`,
        content
      ));
    }
  }

  return actions;
}

function extractMetadataAdvanced(content: string, url: string): ScanMetadata {
  let fwuid: string | null = null;
  let app: string | null = null;
  let token: string | null = null;
  
  // Try multiple patterns for each value
  for (const pattern of FWUID_PATTERNS) {
    const match = pattern.exec(content);
    if (match) {
      fwuid = match[1];
      break;
    }
  }
  
  for (const pattern of APP_PATTERNS) {
    const match = pattern.exec(content);
    if (match) {
      app = match[1];
      break;
    }
  }
  
  for (const pattern of AURA_TOKEN_PATTERNS) {
    const match = pattern.exec(content);
    if (match) {
      token = match[1];
      break;
    }
  }
  
  // Extract loaded components
  const loadedComponents: string[] = [];
  const loadedPattern = /"loaded"\s*:\s*\{([^}]+)\}/;
  const loadedMatch = loadedPattern.exec(content);
  if (loadedMatch) {
    const loadedStr = loadedMatch[1];
    const componentPattern = /"([^"]+)"\s*:/g;
    let compMatch;
    while ((compMatch = componentPattern.exec(loadedStr)) !== null) {
      loadedComponents.push(compMatch[1]);
    }
  }
  
  // Detect endpoints present in the page
  const detectedEndpoints: { path: string; type: string }[] = [];
  for (const endpoint of KNOWN_ENDPOINTS) {
    if (content.includes(endpoint.path)) {
      detectedEndpoints.push({ path: endpoint.path, type: endpoint.type });
    }
  }
  
  // Try to extract full Aura context
  let auraContext: AuraContext | undefined;
  const contextPattern = /\{[^{}]*"mode"\s*:\s*"([^"]+)"[^{}]*"fwuid"\s*:\s*"([^"]+)"[^{}]*"app"\s*:\s*"([^"]+)"[^{}]*\}/;
  const contextMatch = contextPattern.exec(content);
  if (contextMatch) {
    try {
      auraContext = {
        mode: contextMatch[1],
        fwuid: contextMatch[2],
        app: contextMatch[3],
        loaded: {},
        dn: [],
        globals: {},
        uad: false
      };
    } catch {
      // Ignore parse errors
    }
  }
  
  // Extract API version if present
  const apiVersionPattern = /v(\d+\.\d+)/;
  const apiMatch = apiVersionPattern.exec(content);
  
  return {
    fwuid,
    app,
    token,
    scannedUrl: url,
    apiVersion: apiMatch ? apiMatch[1] : undefined,
    loadedComponents,
    detectedEndpoints,
    auraContext
  };
}

function parseCookies(setCookieHeaders: string[]): GuestSession['cookies'] {
  const cookies: GuestSession['cookies'] = [];
  
  for (const header of setCookieHeaders) {
    const parts = header.split(';').map(p => p.trim());
    const [nameValue, ...attributes] = parts;
    const [name, ...valueParts] = nameValue.split('=');
    const value = valueParts.join('=');
    
    if (!name || !value) continue;
    
    const cookie: GuestSession['cookies'][0] = {
      name: name.trim(),
      value: value.trim(),
      domain: '',
      path: '/',
      secure: false,
      httpOnly: false
    };
    
    for (const attr of attributes) {
      const [key, val] = attr.split('=');
      const keyLower = key.toLowerCase().trim();
      
      if (keyLower === 'domain') cookie.domain = val?.trim() || '';
      else if (keyLower === 'path') cookie.path = val?.trim() || '/';
      else if (keyLower === 'secure') cookie.secure = true;
      else if (keyLower === 'httponly') cookie.httpOnly = true;
    }
    
    cookies.push(cookie);
  }
  
  return cookies;
}

function buildRawCookieHeader(cookies: GuestSession['cookies']): string {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

function detectSessionType(cookies: GuestSession['cookies'], content: string): 'guest' | 'authenticated' | 'unknown' {
  const hasSid = cookies.some(c => c.name.toLowerCase() === 'sid');
  const hasOid = cookies.some(c => c.name.toLowerCase() === 'oid');
  
  if (hasSid && hasOid) return 'authenticated';
  
  // Check for guest user patterns
  const guestPatterns = [
    /guest/i,
    /unauthenticated/i,
    /"isGuest"\s*:\s*true/,
    /"userType"\s*:\s*"Guest"/
  ];
  
  for (const pattern of guestPatterns) {
    if (pattern.test(content)) return 'guest';
  }
  
  return cookies.length > 0 ? 'guest' : 'unknown';
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[scan-url] Starting advanced scan: ${targetUrl.href}`);

    // Fetch the page with full headers
    const response = await fetch(targetUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`[scan-url] Fetch failed: ${response.status}`);
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch URL: ${response.status} ${response.statusText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract cookies from response
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    const cookies = parseCookies(setCookieHeaders);
    
    const html = await response.text();
    console.log(`[scan-url] Fetched ${html.length} bytes, ${cookies.length} cookies`);

    // Parse actions and metadata
    const actions = parseAuraActionsAdvanced(html);
    const metadata = extractMetadataAdvanced(html, targetUrl.href);
    
    // Build guest session
    const guestSession: GuestSession = {
      cookies,
      rawCookieHeader: buildRawCookieHeader(cookies),
      sessionType: detectSessionType(cookies, html)
    };

    console.log(`[scan-url] Found ${actions.length} actions from HTML`);

    // Scan JS files
    const jsUrls = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi)]
      .map(m => {
        try {
          return new URL(m[1], targetUrl.href).href;
        } catch {
          return null;
        }
      })
      .filter((url): url is string => url !== null)
      .slice(0, 15); // Scan more JS files

    console.log(`[scan-url] Found ${jsUrls.length} JS files to scan`);

    const jsPromises = jsUrls.map(async (jsUrl) => {
      try {
        const jsResponse = await fetch(jsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': guestSession.rawCookieHeader,
          },
        });
        if (jsResponse.ok) {
          return jsResponse.text();
        }
      } catch (e) {
        warnings.push(`Failed to fetch JS: ${jsUrl}`);
        console.log(`[scan-url] Failed to fetch ${jsUrl}: ${e}`);
      }
      return '';
    });

    const jsContents = await Promise.all(jsPromises);
    
    const allContent = html + jsContents.join('\n');
    
    for (const jsContent of jsContents) {
      if (jsContent) {
        const jsActions = parseAuraActionsAdvanced(jsContent);
        for (const action of jsActions) {
          const key = `${action.controller}:${action.name}`;
          if (!actions.find(a => `${a.controller}:${a.name}` === key)) {
            actions.push(action);
          }
        }
        
        // Update metadata from JS if missing
        if (!metadata.fwuid) {
          for (const pattern of FWUID_PATTERNS) {
            const match = pattern.exec(jsContent);
            if (match) {
              metadata.fwuid = match[1];
              break;
            }
          }
        }
        if (!metadata.token) {
          for (const pattern of AURA_TOKEN_PATTERNS) {
            const match = pattern.exec(jsContent);
            if (match) {
              metadata.token = match[1];
              break;
            }
          }
        }
      }
    }

    // Re-enrich actions with full content context
    const enrichedActions = actions.map(action => {
      if (action.parameters.length === 0) {
        const newParams = extractParametersFromContext(allContent, action.name);
        if (newParams.length > 0) {
          return { ...action, parameters: newParams };
        }
      }
      return action;
    });

    console.log(`[scan-url] Total actions after JS scan: ${enrichedActions.length}`);

    const result: AdvancedScanResult = {
      success: true,
      rawMatches: enrichedActions.length,
      controllers: enrichedActions,
      metadata,
      guestSession,
      jsFilesScanned: jsUrls.length,
      pageSize: html.length,
      scanDuration: Date.now() - startTime,
      warnings
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[scan-url] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        scanDuration: Date.now() - startTime 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
