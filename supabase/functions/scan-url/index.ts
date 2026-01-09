import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// SALESFORCE API ENDPOINTS DATABASE
// ============================================

interface ApiEndpoint {
  path: string;
  name: string;
  description: string;
  type: 'aura' | 'rest' | 'soap' | 'bulk' | 'streaming' | 'chat' | 'connect' | 'apex-rest';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  authRequired: boolean;
  vulnerabilities: string[];
}

const SALESFORCE_ENDPOINTS: ApiEndpoint[] = [
  // Aura Endpoints
  {
    path: '/s/sfsites/aura',
    name: 'Aura Community Endpoint',
    description: 'Primary Aura API for Experience Cloud sites',
    type: 'aura',
    riskLevel: 'high',
    authRequired: false,
    vulnerabilities: ['IDOR via @AuraEnabled methods', 'Object/Field Level Security bypass', 'Guest user enumeration']
  },
  {
    path: '/aura',
    name: 'Aura Classic Endpoint',
    description: 'Classic Aura API endpoint',
    type: 'aura',
    riskLevel: 'high',
    authRequired: true,
    vulnerabilities: ['CSRF token leakage', 'Controller enumeration']
  },
  {
    path: '/lightning/',
    name: 'Lightning Experience',
    description: 'Lightning Experience main endpoint',
    type: 'aura',
    riskLevel: 'medium',
    authRequired: true,
    vulnerabilities: ['Component injection', 'XSS via custom components']
  },
  
  // REST API Endpoints
  {
    path: '/services/data/',
    name: 'REST API',
    description: 'Salesforce REST API for CRUD operations',
    type: 'rest',
    riskLevel: 'high',
    authRequired: true,
    vulnerabilities: ['Overpermissive OAuth scopes', 'Record enumeration', 'Field exposure']
  },
  {
    path: '/services/data/v',
    name: 'REST API Versioned',
    description: 'Versioned REST API endpoint',
    type: 'rest',
    riskLevel: 'high',
    authRequired: true,
    vulnerabilities: ['API version disclosure', 'Deprecated endpoint exploitation']
  },
  {
    path: '/services/apexrest/',
    name: 'Apex REST',
    description: 'Custom Apex REST services',
    type: 'apex-rest',
    riskLevel: 'critical',
    authRequired: true,
    vulnerabilities: ['Custom endpoint vulnerabilities', 'Input validation bypass', 'SOQL injection']
  },
  
  // SOAP API
  {
    path: '/services/Soap/c/',
    name: 'Enterprise SOAP API',
    description: 'Enterprise WSDL SOAP endpoint',
    type: 'soap',
    riskLevel: 'high',
    authRequired: true,
    vulnerabilities: ['WSDL enumeration', 'XXE injection', 'SOAP action spoofing']
  },
  {
    path: '/services/Soap/u/',
    name: 'Partner SOAP API',
    description: 'Partner WSDL SOAP endpoint',
    type: 'soap',
    riskLevel: 'high',
    authRequired: true,
    vulnerabilities: ['Cross-tenant access', 'Session hijacking']
  },
  
  // Bulk API
  {
    path: '/services/async/',
    name: 'Bulk API',
    description: 'Bulk data operations',
    type: 'bulk',
    riskLevel: 'high',
    authRequired: true,
    vulnerabilities: ['Mass data exfiltration', 'Job hijacking']
  },
  {
    path: '/services/data/v*/jobs/',
    name: 'Bulk API 2.0',
    description: 'Bulk API 2.0 endpoint',
    type: 'bulk',
    riskLevel: 'high',
    authRequired: true,
    vulnerabilities: ['Async job manipulation', 'Result interception']
  },
  
  // Streaming API
  {
    path: '/cometd/',
    name: 'Streaming API',
    description: 'CometD streaming endpoint',
    type: 'streaming',
    riskLevel: 'medium',
    authRequired: true,
    vulnerabilities: ['Channel subscription abuse', 'Event injection']
  },
  
  // Chat API
  {
    path: '/chat/rest/',
    name: 'Live Agent Chat',
    description: 'Live Agent chat REST API',
    type: 'chat',
    riskLevel: 'high',
    authRequired: false,
    vulnerabilities: ['Session takeover', 'Agent impersonation', 'Chat log exposure']
  },
  {
    path: '/iamessage/api/',
    name: 'Enhanced Messaging',
    description: 'Enhanced messaging API for Omni-Channel',
    type: 'chat',
    riskLevel: 'high',
    authRequired: false,
    vulnerabilities: ['Unauthenticated message injection', 'Conversation hijacking']
  },
  {
    path: '/embeddedservice/',
    name: 'Embedded Service',
    description: 'Embedded Chat/Bot deployment',
    type: 'chat',
    riskLevel: 'medium',
    authRequired: false,
    vulnerabilities: ['Bot bypass', 'Pre-chat form manipulation']
  },
  
  // Connect API
  {
    path: '/services/connect/',
    name: 'Connect API',
    description: 'Chatter and collaboration APIs',
    type: 'connect',
    riskLevel: 'medium',
    authRequired: true,
    vulnerabilities: ['Social engineering via Chatter', 'File upload bypass']
  }
];

// ============================================
// KNOWN AURA CONTROLLERS - COMPREHENSIVE
// ============================================

interface ControllerAction {
  params: { name: string; type: string; required: boolean; description: string }[];
  returnType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  vulnerabilities?: string[];
}

interface ControllerDefinition {
  description: string;
  category: 'system' | 'record' | 'apex' | 'ui' | 'community' | 'commerce' | 'data' | 'auth' | 'chat' | 'messaging';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  actions: Record<string, ControllerAction>;
}

const KNOWN_AURA_CONTROLLERS: Record<string, ControllerDefinition> = {
  // ============ RECORD OPERATIONS ============
  'RecordUiController': {
    description: 'Record UI operations - CRUD on sObjects',
    category: 'record',
    riskLevel: 'high',
    actions: {
      'getRecordWithFields': {
        params: [
          { name: 'recordId', type: 'Id', required: true, description: 'Salesforce 18-char record ID' },
          { name: 'fields', type: 'List<String>', required: true, description: 'Field API names (e.g., ["Name", "Email"])' }
        ],
        returnType: 'RecordRepresentation',
        riskLevel: 'medium',
        description: 'Retrieve record with specific fields',
        vulnerabilities: ['FLS bypass if fields not checked', 'IDOR via recordId manipulation']
      },
      'getRecordWithLayouts': {
        params: [
          { name: 'recordId', type: 'Id', required: true, description: 'Record ID' },
          { name: 'layoutTypes', type: 'List<String>', required: false, description: 'Full, Compact' },
          { name: 'modes', type: 'List<String>', required: false, description: 'View, Edit, Create' }
        ],
        returnType: 'RecordUi',
        riskLevel: 'medium',
        description: 'Get record with layout metadata'
      },
      'getRecordCreateDefaults': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'sObject API name' },
          { name: 'recordTypeId', type: 'Id', required: false, description: 'Record type for defaults' },
          { name: 'optionalFields', type: 'List<String>', required: false, description: 'Additional fields' }
        ],
        returnType: 'RecordDefaults',
        riskLevel: 'low',
        description: 'Get defaults for new record'
      },
      'getRecordUi': {
        params: [
          { name: 'recordIds', type: 'List<Id>', required: true, description: 'Multiple record IDs' },
          { name: 'layoutTypes', type: 'List<String>', required: false, description: 'Layout types' },
          { name: 'modes', type: 'List<String>', required: false, description: 'View modes' },
          { name: 'optionalFields', type: 'List<String>', required: false, description: 'Extra fields' }
        ],
        returnType: 'RecordUi',
        riskLevel: 'medium',
        description: 'Bulk record UI retrieval',
        vulnerabilities: ['Mass data extraction']
      },
      'getObjectInfo': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'sObject name' }
        ],
        returnType: 'ObjectInfo',
        riskLevel: 'low',
        description: 'Get object metadata',
        vulnerabilities: ['Schema enumeration']
      },
      'getObjectInfos': {
        params: [
          { name: 'objectApiNames', type: 'List<String>', required: true, description: 'Multiple sObject names' }
        ],
        returnType: 'Map<String, ObjectInfo>',
        riskLevel: 'low',
        description: 'Bulk object metadata'
      },
      'createRecord': {
        params: [
          { name: 'recordInput', type: 'RecordInput', required: true, description: 'Record data with apiName and fields' }
        ],
        returnType: 'RecordRepresentation',
        riskLevel: 'high',
        description: 'Create new record',
        vulnerabilities: ['Arbitrary record creation', 'Field injection']
      },
      'updateRecord': {
        params: [
          { name: 'recordInput', type: 'RecordInput', required: true, description: 'Record with ID and updated fields' }
        ],
        returnType: 'RecordRepresentation',
        riskLevel: 'high',
        description: 'Update existing record',
        vulnerabilities: ['Privilege escalation via field update', 'IDOR']
      },
      'deleteRecord': {
        params: [
          { name: 'recordId', type: 'Id', required: true, description: 'Record to delete' }
        ],
        returnType: 'void',
        riskLevel: 'critical',
        description: 'Permanently delete record',
        vulnerabilities: ['Arbitrary record deletion']
      }
    }
  },
  
  // ============ APEX EXECUTION ============
  'ApexActionController': {
    description: 'Execute @AuraEnabled Apex methods',
    category: 'apex',
    riskLevel: 'critical',
    actions: {
      'execute': {
        params: [
          { name: 'namespace', type: 'String', required: false, description: 'Package namespace (blank for default)' },
          { name: 'classname', type: 'String', required: true, description: 'Apex controller class name' },
          { name: 'method', type: 'String', required: true, description: '@AuraEnabled method name' },
          { name: 'params', type: 'Map<String, Object>', required: false, description: 'Method parameters' },
          { name: 'cacheable', type: 'Boolean', required: false, description: 'Use cached result' },
          { name: 'isContinuation', type: 'Boolean', required: false, description: 'Continuation callout' }
        ],
        returnType: 'Object',
        riskLevel: 'critical',
        description: 'Execute server-side Apex',
        vulnerabilities: [
          'SOQL injection via params',
          'Blind SOQL injection',
          'FLS/CRUD bypass if class uses "without sharing"',
          'Arbitrary Apex execution'
        ]
      }
    }
  },
  
  // ============ LIST/QUERY OPERATIONS ============
  'ListUiController': {
    description: 'List view operations',
    category: 'ui',
    riskLevel: 'medium',
    actions: {
      'getListUi': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'sObject API name' },
          { name: 'listViewApiName', type: 'String', required: false, description: 'List view developer name' },
          { name: 'listViewId', type: 'Id', required: false, description: 'List view ID' },
          { name: 'pageSize', type: 'Integer', required: false, description: 'Records per page (max 2000)' },
          { name: 'pageToken', type: 'String', required: false, description: 'Pagination token' },
          { name: 'sortBy', type: 'String', required: false, description: 'Sort field' },
          { name: 'q', type: 'String', required: false, description: 'Search term' }
        ],
        returnType: 'ListUi',
        riskLevel: 'medium',
        description: 'Get list view with records',
        vulnerabilities: ['Data exfiltration via high pageSize', 'Filter bypass']
      },
      'getListsByObjectName': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'sObject name' }
        ],
        returnType: 'ListInfosRepresentation',
        riskLevel: 'low',
        description: 'Get available list views'
      },
      'getListInfoByName': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'sObject name' },
          { name: 'listViewApiName', type: 'String', required: true, description: 'List view name' }
        ],
        returnType: 'ListInfo',
        riskLevel: 'low',
        description: 'Get list view metadata'
      }
    }
  },
  
  // ============ LOOKUP/SEARCH ============
  'LookupController': {
    description: 'Lookup field search',
    category: 'ui',
    riskLevel: 'medium',
    actions: {
      'getLookupRecords': {
        params: [
          { name: 'fieldApiName', type: 'String', required: true, description: 'Lookup field' },
          { name: 'targetApiName', type: 'String', required: true, description: 'Target object' },
          { name: 'requestParams', type: 'Object', required: false, description: 'Search parameters' }
        ],
        returnType: 'LookupRecordsRepresentation',
        riskLevel: 'medium',
        description: 'Search for lookup values',
        vulnerabilities: ['Record enumeration via search']
      },
      'getRecordTypeInfos': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'sObject name' }
        ],
        returnType: 'RecordTypeInfos',
        riskLevel: 'low',
        description: 'Get record types'
      }
    }
  },
  
  // ============ ACTIONS ============
  'ActionsController': {
    description: 'Quick actions and global actions',
    category: 'ui',
    riskLevel: 'high',
    actions: {
      'getRecordActions': {
        params: [
          { name: 'recordIds', type: 'List<Id>', required: true, description: 'Record IDs for context' },
          { name: 'actionTypes', type: 'List<String>', required: false, description: 'StandardButton, QuickAction, etc.' }
        ],
        returnType: 'RecordActions',
        riskLevel: 'low',
        description: 'Get available actions'
      },
      'invokeAction': {
        params: [
          { name: 'actionApiName', type: 'String', required: true, description: 'Action API name' },
          { name: 'recordId', type: 'Id', required: false, description: 'Context record' },
          { name: 'params', type: 'Map<String, Object>', required: false, description: 'Action parameters' }
        ],
        returnType: 'ActionResult',
        riskLevel: 'high',
        description: 'Execute quick action',
        vulnerabilities: ['Action injection', 'Unauthorized action execution']
      }
    }
  },
  
  // ============ AUTHENTICATION ============
  'CommunityLoginController': {
    description: 'Experience Cloud authentication',
    category: 'auth',
    riskLevel: 'critical',
    actions: {
      'login': {
        params: [
          { name: 'username', type: 'String', required: true, description: 'Username or email' },
          { name: 'password', type: 'String', required: true, description: 'Password' },
          { name: 'startUrl', type: 'String', required: false, description: 'Post-login URL' }
        ],
        returnType: 'PageReference',
        riskLevel: 'critical',
        description: 'Authenticate user',
        vulnerabilities: ['Credential stuffing', 'Brute force', 'User enumeration via error messages']
      },
      'getSiteRegisterUrl': {
        params: [],
        returnType: 'String',
        riskLevel: 'low',
        description: 'Get registration URL'
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
        description: 'Get password reset URL'
      },
      'setExperienceId': {
        params: [
          { name: 'expId', type: 'String', required: true, description: 'Experience ID' }
        ],
        returnType: 'void',
        riskLevel: 'low',
        description: 'Set Experience Cloud context'
      }
    }
  },
  
  'SelfRegisterController': {
    description: 'Self-registration for communities',
    category: 'auth',
    riskLevel: 'high',
    actions: {
      'registerUser': {
        params: [
          { name: 'email', type: 'String', required: true, description: 'Email address' },
          { name: 'password', type: 'String', required: true, description: 'Password' },
          { name: 'confirmPassword', type: 'String', required: true, description: 'Confirm password' },
          { name: 'firstName', type: 'String', required: false, description: 'First name' },
          { name: 'lastName', type: 'String', required: true, description: 'Last name' }
        ],
        returnType: 'Id',
        riskLevel: 'high',
        description: 'Register new community user',
        vulnerabilities: ['Account takeover via duplicate email', 'Weak password policy bypass']
      }
    }
  },
  
  // ============ CHAT/MESSAGING ============
  'LiveAgentChatController': {
    description: 'Live Agent chat operations',
    category: 'chat',
    riskLevel: 'high',
    actions: {
      'initChat': {
        params: [
          { name: 'deploymentId', type: 'Id', required: true, description: 'Chat deployment ID' },
          { name: 'orgId', type: 'Id', required: true, description: 'Organization ID' },
          { name: 'buttonId', type: 'Id', required: true, description: 'Chat button ID' }
        ],
        returnType: 'ChatSession',
        riskLevel: 'medium',
        description: 'Initialize chat session',
        vulnerabilities: ['Session fixation', 'Deployment ID enumeration']
      },
      'sendMessage': {
        params: [
          { name: 'sessionKey', type: 'String', required: true, description: 'Chat session key' },
          { name: 'text', type: 'String', required: true, description: 'Message content' }
        ],
        returnType: 'void',
        riskLevel: 'medium',
        description: 'Send chat message',
        vulnerabilities: ['Message injection', 'XSS via agent display']
      },
      'endChat': {
        params: [
          { name: 'sessionKey', type: 'String', required: true, description: 'Chat session key' }
        ],
        returnType: 'void',
        riskLevel: 'low',
        description: 'End chat session'
      }
    }
  },
  
  'MessagingController': {
    description: 'Enhanced Messaging for Omni-Channel',
    category: 'messaging',
    riskLevel: 'high',
    actions: {
      'startConversation': {
        params: [
          { name: 'routingConfigId', type: 'Id', required: true, description: 'Routing configuration' },
          { name: 'routingContext', type: 'Object', required: false, description: 'Context data' }
        ],
        returnType: 'ConversationId',
        riskLevel: 'medium',
        description: 'Start messaging conversation',
        vulnerabilities: ['Routing manipulation']
      },
      'sendMessage': {
        params: [
          { name: 'conversationId', type: 'Id', required: true, description: 'Conversation ID' },
          { name: 'message', type: 'Object', required: true, description: 'Message payload' }
        ],
        returnType: 'MessageId',
        riskLevel: 'medium',
        description: 'Send message in conversation',
        vulnerabilities: ['Message spoofing', 'Attachment injection']
      },
      'closeConversation': {
        params: [
          { name: 'conversationId', type: 'Id', required: true, description: 'Conversation ID' }
        ],
        returnType: 'void',
        riskLevel: 'medium',
        description: 'Close messaging conversation',
        vulnerabilities: ['Unauthorized conversation closure (DoS)']
      }
    }
  },
  
  // ============ CONTENT/FILES ============
  'ContentController': {
    description: 'Content document operations',
    category: 'data',
    riskLevel: 'high',
    actions: {
      'getContentDocumentLink': {
        params: [
          { name: 'contentDocumentId', type: 'Id', required: true, description: 'Document ID' }
        ],
        returnType: 'ContentDistribution',
        riskLevel: 'high',
        description: 'Get public link to document',
        vulnerabilities: ['Document enumeration', 'Unauthorized file access']
      },
      'uploadFile': {
        params: [
          { name: 'base64Data', type: 'String', required: true, description: 'Base64 file content' },
          { name: 'fileName', type: 'String', required: true, description: 'File name with extension' },
          { name: 'contentType', type: 'String', required: false, description: 'MIME type' },
          { name: 'linkedEntityId', type: 'Id', required: false, description: 'Parent record ID' }
        ],
        returnType: 'ContentVersion',
        riskLevel: 'high',
        description: 'Upload file',
        vulnerabilities: ['Malicious file upload', 'File type bypass', 'Size limit bypass']
      },
      'deleteFile': {
        params: [
          { name: 'contentDocumentId', type: 'Id', required: true, description: 'Document ID' }
        ],
        returnType: 'Boolean',
        riskLevel: 'critical',
        description: 'Delete content document',
        vulnerabilities: ['Arbitrary file deletion']
      }
    }
  },
  
  // ============ COMMERCE ============
  'CartController': {
    description: 'B2B/B2C Commerce cart',
    category: 'commerce',
    riskLevel: 'high',
    actions: {
      'getCart': {
        params: [
          { name: 'webstoreId', type: 'Id', required: true, description: 'Webstore ID' },
          { name: 'effectiveAccountId', type: 'Id', required: false, description: 'Account context' },
          { name: 'activeCartOrId', type: 'String', required: false, description: '"active" or cart ID' }
        ],
        returnType: 'CartSummary',
        riskLevel: 'medium',
        description: 'Get cart summary',
        vulnerabilities: ['Cart hijacking via ID enumeration']
      },
      'addItemToCart': {
        params: [
          { name: 'webstoreId', type: 'Id', required: true, description: 'Webstore ID' },
          { name: 'productId', type: 'Id', required: true, description: 'Product to add' },
          { name: 'quantity', type: 'String', required: true, description: 'Quantity' },
          { name: 'effectiveAccountId', type: 'Id', required: false, description: 'Account context' }
        ],
        returnType: 'CartItem',
        riskLevel: 'medium',
        description: 'Add product to cart',
        vulnerabilities: ['Price manipulation', 'Inventory bypass']
      },
      'updateCartItem': {
        params: [
          { name: 'webstoreId', type: 'Id', required: true, description: 'Webstore ID' },
          { name: 'cartId', type: 'Id', required: true, description: 'Cart ID' },
          { name: 'cartItemId', type: 'Id', required: true, description: 'Cart item ID' },
          { name: 'quantity', type: 'String', required: true, description: 'New quantity' }
        ],
        returnType: 'CartItem',
        riskLevel: 'medium',
        description: 'Update cart item'
      },
      'deleteCartItem': {
        params: [
          { name: 'webstoreId', type: 'Id', required: true, description: 'Webstore ID' },
          { name: 'cartId', type: 'Id', required: true, description: 'Cart ID' },
          { name: 'cartItemId', type: 'Id', required: true, description: 'Item to remove' }
        ],
        returnType: 'void',
        riskLevel: 'medium',
        description: 'Remove cart item'
      },
      'checkout': {
        params: [
          { name: 'webstoreId', type: 'Id', required: true, description: 'Webstore ID' },
          { name: 'cartId', type: 'Id', required: true, description: 'Cart ID' }
        ],
        returnType: 'CheckoutSession',
        riskLevel: 'high',
        description: 'Start checkout',
        vulnerabilities: ['Price manipulation at checkout', 'Discount code abuse']
      }
    }
  },
  
  'ProductController': {
    description: 'Commerce product catalog',
    category: 'commerce',
    riskLevel: 'medium',
    actions: {
      'getProduct': {
        params: [
          { name: 'webstoreId', type: 'Id', required: true, description: 'Webstore ID' },
          { name: 'productId', type: 'Id', required: true, description: 'Product ID' },
          { name: 'effectiveAccountId', type: 'Id', required: false, description: 'Account context' }
        ],
        returnType: 'ProductDetail',
        riskLevel: 'low',
        description: 'Get product details'
      },
      'searchProducts': {
        params: [
          { name: 'webstoreId', type: 'Id', required: true, description: 'Webstore ID' },
          { name: 'searchTerm', type: 'String', required: false, description: 'Search query' },
          { name: 'categoryId', type: 'Id', required: false, description: 'Category filter' },
          { name: 'refinements', type: 'Map<String, List<String>>', required: false, description: 'Facet filters' },
          { name: 'page', type: 'Integer', required: false, description: 'Page number' },
          { name: 'pageSize', type: 'Integer', required: false, description: 'Results per page' }
        ],
        returnType: 'ProductSearchResults',
        riskLevel: 'low',
        description: 'Search product catalog'
      },
      'getProductPrice': {
        params: [
          { name: 'webstoreId', type: 'Id', required: true, description: 'Webstore ID' },
          { name: 'productId', type: 'Id', required: true, description: 'Product ID' },
          { name: 'effectiveAccountId', type: 'Id', required: false, description: 'Account for pricing' }
        ],
        returnType: 'ProductPrice',
        riskLevel: 'medium',
        description: 'Get product pricing',
        vulnerabilities: ['Price tier enumeration']
      }
    }
  }
};

// ============================================
// VULNERABILITY PATTERNS
// ============================================

interface VulnerabilityPattern {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: 'postMessage' | 'aura' | 'csrf' | 'injection' | 'auth' | 'config' | 'disclosure';
  pattern: RegExp;
  recommendation: string;
}

const VULNERABILITY_PATTERNS: VulnerabilityPattern[] = [
  // postMessage vulnerabilities
  {
    id: 'PM001',
    name: 'Insecure postMessage Wildcard',
    description: 'postMessage with wildcard (*) targetOrigin exposes data to any receiver',
    severity: 'high',
    category: 'postMessage',
    pattern: /postMessage\s*\([^)]+,\s*['"`]\*['"`]\s*\)/gi,
    recommendation: 'Always specify exact targetOrigin instead of "*"'
  },
  {
    id: 'PM002',
    name: 'Missing Origin Validation',
    description: 'Message event listener without origin validation',
    severity: 'high',
    category: 'postMessage',
    pattern: /addEventListener\s*\(\s*['"`]message['"`][^)]+(?!event\.origin)/gi,
    recommendation: 'Always validate event.origin before processing messages'
  },
  {
    id: 'PM003',
    name: 'Window Object Validation (Insecure)',
    description: 'Checking event.source instead of event.origin is insecure',
    severity: 'medium',
    category: 'postMessage',
    pattern: /event\.source\s*===?\s*\w+/gi,
    recommendation: 'Use event.origin for validation, not event.source'
  },
  {
    id: 'PM004',
    name: 'Regex Origin Validation',
    description: 'Using regex for origin validation can be bypassed',
    severity: 'medium',
    category: 'postMessage',
    pattern: /\.test\s*\(\s*event\.origin\s*\)/gi,
    recommendation: 'Use exact string comparison for origin validation'
  },
  
  // Token/Credential exposure
  {
    id: 'DISC001',
    name: 'Aura Token in JavaScript',
    description: 'Aura CSRF token exposed in client-side JavaScript',
    severity: 'info',
    category: 'disclosure',
    pattern: /aura\.token\s*=\s*['"`][^'"`]+['"`]/gi,
    recommendation: 'Token exposure is expected but ensure HTTPS and secure cookies'
  },
  {
    id: 'DISC002',
    name: 'Session ID Exposure',
    description: 'Session ID (sid) visible in client code',
    severity: 'medium',
    category: 'disclosure',
    pattern: /sid\s*[:=]\s*['"`][a-zA-Z0-9!]+['"`]/gi,
    recommendation: 'Ensure session cookies use HttpOnly and Secure flags'
  },
  {
    id: 'DISC003',
    name: 'Organization ID Exposure',
    description: 'Salesforce Organization ID exposed',
    severity: 'low',
    category: 'disclosure',
    pattern: /orgId\s*[:=]\s*['"`]00D[a-zA-Z0-9]{15}['"`]/gi,
    recommendation: 'Org ID exposure is low risk but can aid reconnaissance'
  },
  
  // Aura-specific vulnerabilities
  {
    id: 'AURA001',
    name: 'Without Sharing Class',
    description: 'Apex class declared "without sharing" bypasses record-level security',
    severity: 'high',
    category: 'aura',
    pattern: /without\s+sharing/gi,
    recommendation: 'Use "with sharing" unless explicitly required, then add manual checks'
  },
  {
    id: 'AURA002',
    name: 'Dynamic SOQL',
    description: 'Dynamic SOQL query construction may be vulnerable to injection',
    severity: 'high',
    category: 'injection',
    pattern: /Database\.query\s*\([^)]*\+/gi,
    recommendation: 'Use bind variables and String.escapeSingleQuotes()'
  },
  {
    id: 'AURA003',
    name: 'Unescaped Output',
    description: 'User input rendered without escaping',
    severity: 'high',
    category: 'injection',
    pattern: /\{!(?!URLFOR|JSENCODE|HTMLENCODE)[^}]+\}/gi,
    recommendation: 'Use JSENCODE() or HTMLENCODE() for output'
  },
  
  // Configuration issues
  {
    id: 'CFG001',
    name: 'Debug Mode Enabled',
    description: 'Debug mode may expose sensitive information',
    severity: 'low',
    category: 'config',
    pattern: /["']mode["']\s*:\s*["']DEV["']/gi,
    recommendation: 'Ensure production uses PROD mode'
  },
  {
    id: 'CFG002',
    name: 'Clickjacking Protection Missing',
    description: 'Missing X-Frame-Options or CSP frame-ancestors',
    severity: 'medium',
    category: 'config',
    pattern: /X-Frame-Options/gi, // Inverse check - presence is good
    recommendation: 'Set X-Frame-Options: SAMEORIGIN or CSP frame-ancestors'
  }
];

// ============================================
// PARSING FUNCTIONS
// ============================================

const AURA_DESCRIPTOR_PATTERN = /aura:\/\/([^/]+)\/ACTION\$([A-Za-z0-9_]+)/g;
const APEX_CONTROLLER_PATTERN = /apex:\/\/([^/]+)\/ACTION\$([A-Za-z0-9_]+)/g;
const SERVICE_COMPONENT_PATTERN = /serviceComponent:\/\/ui\.([^.]+)\.([A-Za-z0-9_]+)/g;

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
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  description: string;
  isKnown: boolean;
  requiresAuth: boolean;
  vulnerabilities: string[];
}

interface DetectedVulnerability {
  id: string;
  name: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  matchedPattern: string;
  recommendation: string;
  location?: string;
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

interface ScanMetadata {
  fwuid: string | null;
  app: string | null;
  token: string | null;
  scannedUrl: string;
  apiVersion?: string;
  loadedComponents: string[];
  detectedEndpoints: { path: string; type: string; riskLevel: string; description: string }[];
  auraContext?: {
    mode: string;
    fwuid: string;
    app: string;
  };
}

interface AdvancedScanResult {
  success: boolean;
  rawMatches: number;
  controllers: EnrichedAuraAction[];
  metadata: ScanMetadata;
  guestSession: GuestSession;
  vulnerabilities: DetectedVulnerability[];
  jsFilesScanned: number;
  pageSize: number;
  scanDuration: number;
  warnings: string[];
}

function inferParameterType(value: string): string {
  value = value.trim();
  if (value === 'true' || value === 'false') return 'Boolean';
  if (/^\d+$/.test(value)) return 'Integer';
  if (/^\d+\.\d+$/.test(value)) return 'Decimal';
  if (/^["'].*["']$/.test(value)) return 'String';
  if (/^\[/.test(value)) return 'List<Object>';
  if (/^\{/.test(value)) return 'Map<String, Object>';
  if (/recordId|Id$/i.test(value)) return 'Id';
  return 'Object';
}

function extractParametersFromContext(content: string, actionName: string): ActionParameter[] {
  const params: ActionParameter[] = [];
  const seen = new Set<string>();
  
  const contextPattern = new RegExp(
    `${actionName}[\\s\\S]{0,1000}setParams?\\s*\\(\\s*\\{([^}]+)\\}`,
    'gi'
  );
  
  let match;
  const paramKeyPattern = /["']?(\w+)["']?\s*:\s*([^,}]+)/g;
  
  while ((match = contextPattern.exec(content)) !== null) {
    const paramsStr = match[1];
    let keyMatch;
    paramKeyPattern.lastIndex = 0;
    
    while ((keyMatch = paramKeyPattern.exec(paramsStr)) !== null) {
      const paramName = keyMatch[1];
      if (!seen.has(paramName)) {
        seen.add(paramName);
        params.push({
          name: paramName,
          type: inferParameterType(keyMatch[2]),
          required: true,
          description: 'Inferred from context',
          inferredFrom: 'context'
        });
      }
    }
  }
  
  return params;
}

function enrichAction(name: string, controller: string, descriptor: string, content: string): EnrichedAuraAction {
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
      requiresAuth: knownAction.riskLevel === 'high' || knownAction.riskLevel === 'critical',
      vulnerabilities: knownAction.vulnerabilities || []
    };
  }
  
  const inferredParams = extractParametersFromContext(content, name);
  
  let category = 'custom';
  let riskLevel: EnrichedAuraAction['riskLevel'] = 'unknown';
  const vulnerabilities: string[] = [];
  
  const lowerName = name.toLowerCase();
  const lowerController = controller.toLowerCase();
  
  if (lowerName.includes('delete') || lowerName.includes('remove')) {
    riskLevel = 'critical';
    vulnerabilities.push('Potential arbitrary deletion');
  } else if (lowerName.includes('update') || lowerName.includes('save') || lowerName.includes('create') || lowerName.includes('insert')) {
    riskLevel = 'high';
    vulnerabilities.push('Potential IDOR or unauthorized modification');
  } else if (lowerName.includes('get') || lowerName.includes('fetch') || lowerName.includes('load') || lowerName.includes('read')) {
    riskLevel = 'medium';
    vulnerabilities.push('Potential data exposure');
  }
  
  if (lowerController.includes('login') || lowerController.includes('auth')) {
    category = 'auth';
  } else if (lowerController.includes('cart') || lowerController.includes('commerce')) {
    category = 'commerce';
  } else if (lowerController.includes('community') || lowerController.includes('site')) {
    category = 'community';
  } else if (lowerController.includes('record') || lowerController.includes('sobject')) {
    category = 'record';
  } else if (lowerController.includes('chat') || lowerController.includes('message')) {
    category = 'chat';
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
    requiresAuth: riskLevel === 'high' || riskLevel === 'critical',
    vulnerabilities
  };
}

function parseAuraActionsAdvanced(content: string): EnrichedAuraAction[] {
  const actions: EnrichedAuraAction[] = [];
  const seen = new Set<string>();

  let match;
  AURA_DESCRIPTOR_PATTERN.lastIndex = 0;
  while ((match = AURA_DESCRIPTOR_PATTERN.exec(content)) !== null) {
    const key = `aura:${match[1]}:${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      actions.push(enrichAction(match[2], match[1], `aura://${match[1]}/ACTION$${match[2]}`, content));
    }
  }

  APEX_CONTROLLER_PATTERN.lastIndex = 0;
  while ((match = APEX_CONTROLLER_PATTERN.exec(content)) !== null) {
    const key = `apex:${match[1]}:${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      actions.push(enrichAction(match[2], match[1], `apex://${match[1]}/ACTION$${match[2]}`, content));
    }
  }

  SERVICE_COMPONENT_PATTERN.lastIndex = 0;
  while ((match = SERVICE_COMPONENT_PATTERN.exec(content)) !== null) {
    const key = `svc:${match[1]}:${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      actions.push(enrichAction(match[2], match[1], `serviceComponent://ui.${match[1]}.${match[2]}`, content));
    }
  }

  return actions;
}

function detectVulnerabilities(content: string): DetectedVulnerability[] {
  const vulnerabilities: DetectedVulnerability[] = [];
  
  for (const pattern of VULNERABILITY_PATTERNS) {
    pattern.pattern.lastIndex = 0;
    const matches = content.match(pattern.pattern);
    
    if (matches && matches.length > 0) {
      vulnerabilities.push({
        id: pattern.id,
        name: pattern.name,
        description: pattern.description,
        severity: pattern.severity,
        category: pattern.category,
        matchedPattern: matches[0].substring(0, 100),
        recommendation: pattern.recommendation,
        location: `Found ${matches.length} occurrence(s)`
      });
    }
  }
  
  return vulnerabilities;
}

function extractMetadataAdvanced(content: string, url: string): ScanMetadata {
  let fwuid: string | null = null;
  let app: string | null = null;
  let token: string | null = null;
  
  for (const pattern of FWUID_PATTERNS) {
    const match = pattern.exec(content);
    if (match) { fwuid = match[1]; break; }
  }
  
  for (const pattern of APP_PATTERNS) {
    const match = pattern.exec(content);
    if (match) { app = match[1]; break; }
  }
  
  for (const pattern of AURA_TOKEN_PATTERNS) {
    const match = pattern.exec(content);
    if (match) { token = match[1]; break; }
  }
  
  const loadedComponents: string[] = [];
  const loadedPattern = /"loaded"\s*:\s*\{([^}]+)\}/;
  const loadedMatch = loadedPattern.exec(content);
  if (loadedMatch) {
    const componentPattern = /"([^"]+)"\s*:/g;
    let compMatch;
    while ((compMatch = componentPattern.exec(loadedMatch[1])) !== null) {
      loadedComponents.push(compMatch[1]);
    }
  }
  
  const detectedEndpoints: ScanMetadata['detectedEndpoints'] = [];
  for (const endpoint of SALESFORCE_ENDPOINTS) {
    if (content.includes(endpoint.path)) {
      detectedEndpoints.push({
        path: endpoint.path,
        type: endpoint.type,
        riskLevel: endpoint.riskLevel,
        description: endpoint.description
      });
    }
  }
  
  let auraContext: ScanMetadata['auraContext'];
  const modePattern = /"mode"\s*:\s*"([^"]+)"/;
  const modeMatch = modePattern.exec(content);
  if (modeMatch && fwuid && app) {
    auraContext = { mode: modeMatch[1], fwuid, app };
  }
  
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

function detectSessionType(cookies: GuestSession['cookies'], content: string): 'guest' | 'authenticated' | 'unknown' {
  const hasSid = cookies.some(c => c.name.toLowerCase() === 'sid');
  const hasOid = cookies.some(c => c.name.toLowerCase() === 'oid');
  
  if (hasSid && hasOid) return 'authenticated';
  
  const guestPatterns = [/guest/i, /unauthenticated/i, /"isGuest"\s*:\s*true/, /"userType"\s*:\s*"Guest"/];
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

    console.log(`[scan-url] Advanced security scan: ${targetUrl.href}`);

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
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch URL: ${response.status} ${response.statusText}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    const cookies = parseCookies(setCookieHeaders);
    
    const html = await response.text();
    console.log(`[scan-url] Fetched ${html.length} bytes, ${cookies.length} cookies`);

    const actions = parseAuraActionsAdvanced(html);
    const metadata = extractMetadataAdvanced(html, targetUrl.href);
    const vulnerabilities = detectVulnerabilities(html);
    
    const guestSession: GuestSession = {
      cookies,
      rawCookieHeader: cookies.map(c => `${c.name}=${c.value}`).join('; '),
      sessionType: detectSessionType(cookies, html)
    };

    console.log(`[scan-url] Found ${actions.length} actions, ${vulnerabilities.length} vulnerabilities`);

    // Scan JS files
    const jsUrls = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js[^"']*)["']/gi)]
      .map(m => {
        try { return new URL(m[1], targetUrl.href).href; }
        catch { return null; }
      })
      .filter((url): url is string => url !== null)
      .slice(0, 15);

    console.log(`[scan-url] Found ${jsUrls.length} JS files to scan`);

    const jsPromises = jsUrls.map(async (jsUrl) => {
      try {
        const jsResponse = await fetch(jsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': guestSession.rawCookieHeader,
          },
        });
        if (jsResponse.ok) return jsResponse.text();
      } catch (e) {
        warnings.push(`Failed to fetch JS: ${jsUrl}`);
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
        
        // Detect vulnerabilities in JS
        const jsVulns = detectVulnerabilities(jsContent);
        for (const vuln of jsVulns) {
          if (!vulnerabilities.find(v => v.id === vuln.id)) {
            vulnerabilities.push(vuln);
          }
        }
        
        // Update metadata from JS if missing
        if (!metadata.fwuid) {
          for (const pattern of FWUID_PATTERNS) {
            const match = pattern.exec(jsContent);
            if (match) { metadata.fwuid = match[1]; break; }
          }
        }
        if (!metadata.token) {
          for (const pattern of AURA_TOKEN_PATTERNS) {
            const match = pattern.exec(jsContent);
            if (match) { metadata.token = match[1]; break; }
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

    console.log(`[scan-url] Final: ${enrichedActions.length} actions, ${vulnerabilities.length} vulns`);

    const result: AdvancedScanResult = {
      success: true,
      rawMatches: enrichedActions.length,
      controllers: enrichedActions,
      metadata,
      guestSession,
      vulnerabilities,
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
