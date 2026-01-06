// Common Aura controllers and their typical parameters
export const COMMON_CONTROLLERS: Record<string, {
  description: string;
  actions: Record<string, { params: Record<string, string>; risk: 'low' | 'medium' | 'high' | 'critical' }>;
}> = {
  'apex://AuraEnabled': {
    description: 'Custom Apex controllers with @AuraEnabled methods',
    actions: {}
  },
  'aura://RecordUiController': {
    description: 'Record UI operations',
    actions: {
      getRecordWithFields: {
        params: { recordId: 'string', fields: 'array' },
        risk: 'medium'
      },
      getRecordCreateDefaults: {
        params: { objectApiName: 'string' },
        risk: 'low'
      }
    }
  },
  'aura://ApexActionController': {
    description: 'Execute Apex actions',
    actions: {
      execute: {
        params: { namespace: 'string', classname: 'string', method: 'string', params: 'object' },
        risk: 'critical'
      }
    }
  }
};

export function getDefaultParams(type: string): unknown {
  switch (type.toLowerCase()) {
    case 'string':
      return '';
    case 'integer':
    case 'number':
    case 'int':
      return 0;
    case 'boolean':
    case 'bool':
      return false;
    case 'array':
    case 'list':
      return [];
    case 'object':
    case 'map':
      return {};
    case 'id':
      return '001000000000000AAA';
    default:
      return null;
  }
}

export function generateSampleParams(params: { name: string; type: string }[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const param of params) {
    result[param.name] = getDefaultParams(param.type);
  }
  return result;
}
