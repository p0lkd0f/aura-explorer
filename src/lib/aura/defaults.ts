import type { ActionParameter, KnownControllerDefinition } from './types';

// ============================================
// KNOWN CONTROLLERS DATABASE
// ============================================

export const KNOWN_CONTROLLERS: Record<string, KnownControllerDefinition> = {
  // Record UI Controllers
  'RecordUiController': {
    description: 'Record UI operations - view, create, update records',
    category: 'record',
    riskLevel: 'medium',
    actions: {
      'getRecordWithFields': {
        params: [
          { name: 'recordId', type: 'Id', required: true, description: 'Salesforce record ID (18 chars)' },
          { name: 'fields', type: 'List<String>', required: true, description: 'Field API names to retrieve' }
        ],
        returnType: 'RecordUiResponse',
        riskLevel: 'medium',
        description: 'Get record data with specified fields'
      },
      'getRecordCreateDefaults': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'Object API name (e.g., Account, Contact)' },
          { name: 'recordTypeId', type: 'Id', required: false, description: 'Record type ID for defaults' }
        ],
        returnType: 'RecordDefaults',
        riskLevel: 'low',
        description: 'Get default values for new record creation'
      },
      'getRecordUi': {
        params: [
          { name: 'recordIds', type: 'List<Id>', required: true, description: 'List of record IDs' },
          { name: 'layoutTypes', type: 'List<String>', required: false, description: 'Full, Compact, etc.' },
          { name: 'modes', type: 'List<String>', required: false, description: 'View, Edit, Create' }
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
        description: 'Update record fields - requires write access'
      },
      'createRecord': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'Object API name' },
          { name: 'fields', type: 'Map<String, Object>', required: true, description: 'Field values for new record' }
        ],
        returnType: 'RecordUiResponse',
        riskLevel: 'high',
        description: 'Create new record - requires create access'
      },
      'deleteRecord': {
        params: [
          { name: 'recordId', type: 'Id', required: true, description: 'Record to delete' }
        ],
        returnType: 'Boolean',
        riskLevel: 'critical',
        description: 'Permanently delete a record'
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
          { name: 'namespace', type: 'String', required: false, description: 'Apex namespace (blank for default)' },
          { name: 'classname', type: 'String', required: true, description: 'Apex controller class name' },
          { name: 'method', type: 'String', required: true, description: '@AuraEnabled method name' },
          { name: 'params', type: 'Map<String, Object>', required: false, description: 'Method parameters' },
          { name: 'cacheable', type: 'Boolean', required: false, description: 'Use cached response if available' }
        ],
        returnType: 'Object',
        riskLevel: 'critical',
        description: 'Execute server-side Apex code'
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
          { name: 'listViewApiName', type: 'String', required: false, description: 'List view developer name' },
          { name: 'pageSize', type: 'Integer', required: false, description: 'Records per page (max 2000)' },
          { name: 'pageToken', type: 'String', required: false, description: 'Token for next page' }
        ],
        returnType: 'ListUiResponse',
        riskLevel: 'medium',
        description: 'Get list view data with records'
      },
      'getListsByObjectName': {
        params: [
          { name: 'objectApiName', type: 'String', required: true, description: 'Object API name' }
        ],
        returnType: 'List<ListView>',
        riskLevel: 'low',
        description: 'Get all list views for an object'
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
        description: 'Get record types available to user'
      },
      'search': {
        params: [
          { name: 'searchTerm', type: 'String', required: true, description: 'Search query string' },
          { name: 'objectApiName', type: 'String', required: true, description: 'Object to search' },
          { name: 'fieldApiName', type: 'String', required: false, description: 'Specific field to match' },
          { name: 'maxResults', type: 'Integer', required: false, description: 'Max results (default 5)' }
        ],
        returnType: 'List<LookupResult>',
        riskLevel: 'medium',
        description: 'Search records for lookup field'
      }
    }
  },
  
  // Community Controllers
  'CommunityLoginController': {
    description: 'Community/Experience Cloud login',
    category: 'auth',
    riskLevel: 'high',
    actions: {
      'login': {
        params: [
          { name: 'username', type: 'String', required: true, description: 'Username or email' },
          { name: 'password', type: 'String', required: true, description: 'User password' },
          { name: 'startUrl', type: 'String', required: false, description: 'Post-login redirect URL' }
        ],
        returnType: 'LoginResult',
        riskLevel: 'critical',
        description: 'Authenticate community user'
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
          { name: 'cartId', type: 'Id', required: false, description: 'Cart ID (or current cart)' },
          { name: 'effectiveAccountId', type: 'Id', required: false, description: 'Account for B2B context' }
        ],
        returnType: 'Cart',
        riskLevel: 'medium',
        description: 'Get cart details and items'
      },
      'addToCart': {
        params: [
          { name: 'productId', type: 'Id', required: true, description: 'Product to add' },
          { name: 'quantity', type: 'Integer', required: true, description: 'Quantity to add' },
          { name: 'cartId', type: 'Id', required: false, description: 'Target cart ID' }
        ],
        returnType: 'CartItem',
        riskLevel: 'medium',
        description: 'Add product to cart'
      },
      'updateCartItem': {
        params: [
          { name: 'cartItemId', type: 'Id', required: true, description: 'Cart item to update' },
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
        description: 'Start checkout process'
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
          { name: 'pageSize', type: 'Integer', required: false, description: 'Results per page' },
          { name: 'page', type: 'Integer', required: false, description: 'Page number' }
        ],
        returnType: 'ProductSearchResult',
        riskLevel: 'low',
        description: 'Search product catalog'
      }
    }
  },
  
  // Content Controller
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
        description: 'Get document download link'
      },
      'uploadFile': {
        params: [
          { name: 'base64Data', type: 'String', required: true, description: 'Base64 encoded file' },
          { name: 'fileName', type: 'String', required: true, description: 'File name with extension' },
          { name: 'recordId', type: 'Id', required: false, description: 'Parent record ID' }
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
  },
  
  // Chatter Controller
  'ChatterController': {
    description: 'Chatter feed operations',
    category: 'ui',
    riskLevel: 'medium',
    actions: {
      'getFeed': {
        params: [
          { name: 'feedType', type: 'String', required: true, description: 'News, Record, UserProfile, etc.' },
          { name: 'subjectId', type: 'Id', required: false, description: 'Record or user ID' },
          { name: 'pageSize', type: 'Integer', required: false, description: 'Items per page' }
        ],
        returnType: 'ChatterFeed',
        riskLevel: 'medium',
        description: 'Get Chatter feed'
      },
      'postFeedElement': {
        params: [
          { name: 'subjectId', type: 'Id', required: true, description: 'Where to post' },
          { name: 'text', type: 'String', required: true, description: 'Post content' },
          { name: 'visibility', type: 'String', required: false, description: 'AllUsers or InternalUsers' }
        ],
        returnType: 'FeedElement',
        riskLevel: 'high',
        description: 'Create Chatter post'
      }
    }
  }
};

// ============================================
// DEFAULT VALUE GENERATORS
// ============================================

export function getDefaultValue(type: string): unknown {
  const normalizedType = type.toLowerCase().replace(/[<>\s]/g, '');
  
  // Handle list/array types
  if (normalizedType.startsWith('list') || normalizedType.startsWith('array')) {
    return [];
  }
  
  // Handle map/object types
  if (normalizedType.startsWith('map') || normalizedType === 'object') {
    return {};
  }
  
  // Handle specific types
  switch (normalizedType) {
    case 'string':
      return '';
    case 'id':
      return '001000000000000AAA'; // Valid-looking Salesforce ID
    case 'integer':
    case 'int':
    case 'long':
      return 0;
    case 'decimal':
    case 'double':
    case 'float':
      return 0.0;
    case 'boolean':
    case 'bool':
      return false;
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'datetime':
      return new Date().toISOString();
    case 'time':
      return '12:00:00.000Z';
    default:
      return null;
  }
}

export function generateSampleParams(params: ActionParameter[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const param of params) {
    // Only include required params by default, but mark optional ones with comments
    if (param.required) {
      result[param.name] = getDefaultValue(param.type);
    }
  }
  
  return result;
}

export function generateFullParams(params: ActionParameter[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const param of params) {
    result[param.name] = getDefaultValue(param.type);
  }
  
  return result;
}

// ============================================
// RISK LEVEL UTILITIES
// ============================================

export function getRiskColor(level: string | undefined): string {
  switch (level) {
    case 'critical':
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-green-500';
    default:
      return 'text-muted-foreground';
  }
}

export function getRiskBadgeVariant(level: string | undefined): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (level) {
    case 'critical':
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function getCategoryIcon(category: string | undefined): string {
  switch (category) {
    case 'auth':
      return '🔐';
    case 'record':
      return '📝';
    case 'apex':
      return '⚡';
    case 'commerce':
      return '🛒';
    case 'data':
      return '💾';
    case 'community':
      return '👥';
    case 'ui':
      return '🎨';
    case 'system':
      return '⚙️';
    default:
      return '📦';
  }
}
