import type { AuraAction } from './types';

// Primary pattern for aura:// descriptors
const AURA_DESCRIPTOR_PATTERN = /aura:\/\/([^/]+)\/ACTION\$([A-Za-z0-9_]+)/g;

// Secondary patterns for different Aura formats
const APEX_CONTROLLER_PATTERN = /apex:\/\/([^/]+)\/ACTION\$([A-Za-z0-9_]+)/g;
const ACTION_DESCRIPTOR_PATTERN = /"descriptor"\s*:\s*"serviceComponent:\/\/ui\.([^"]+)\.([^"]+)"/g;
const COMPONENT_DEF_PATTERN = /componentDef\s*:\s*["']markup:\/\/([^"']+)["']/g;

export function parseAuraActions(js: string): AuraAction[] {
  const actions: AuraAction[] = [];
  const seen = new Set<string>();

  // Parse aura:// descriptors
  let match;
  while ((match = AURA_DESCRIPTOR_PATTERN.exec(js)) !== null) {
    const key = `${match[1]}:${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      actions.push({
        name: match[2],
        controller: match[1],
        descriptor: `aura://${match[1]}/ACTION$${match[2]}`,
        returnType: 'unknown',
        parameters: inferParameters(js, match[1], match[2])
      });
    }
  }

  // Parse apex:// descriptors
  APEX_CONTROLLER_PATTERN.lastIndex = 0;
  while ((match = APEX_CONTROLLER_PATTERN.exec(js)) !== null) {
    const key = `apex:${match[1]}:${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      actions.push({
        name: match[2],
        controller: match[1],
        descriptor: `apex://${match[1]}/ACTION$${match[2]}`,
        returnType: 'unknown',
        parameters: inferParameters(js, match[1], match[2])
      });
    }
  }

  return actions;
}

// Attempt to infer parameters from surrounding context
function inferParameters(js: string, controller: string, action: string): { name: string; type: string }[] {
  const params: { name: string; type: string }[] = [];
  
  // Look for setParams calls near the action
  const paramPattern = new RegExp(
    `${action}[\\s\\S]{0,500}setParams?\\s*\\(\\s*\\{([^}]+)\\}`,
    'gi'
  );
  
  const paramMatch = paramPattern.exec(js);
  if (paramMatch) {
    const paramsStr = paramMatch[1];
    const keyPattern = /["']?(\w+)["']?\s*:/g;
    let keyMatch;
    while ((keyMatch = keyPattern.exec(paramsStr)) !== null) {
      if (!params.find(p => p.name === keyMatch[1])) {
        params.push({ name: keyMatch[1], type: 'any' });
      }
    }
  }

  return params;
}

export function extractFwuid(js: string): string | null {
  const fwuidPattern = /"fwuid"\s*:\s*"([^"]+)"/;
  const match = fwuidPattern.exec(js);
  return match ? match[1] : null;
}

export function extractAppName(js: string): string | null {
  const appPattern = /"app"\s*:\s*"([^"]+)"/;
  const match = appPattern.exec(js);
  return match ? match[1] : null;
}

export function extractAuraToken(js: string): string | null {
  const tokenPattern = /aura\.token\s*=\s*["']([^"']+)["']/;
  const match = tokenPattern.exec(js);
  return match ? match[1] : null;
}
