import * as fs from 'fs';
import * as path from 'path';
import rc from 'rc';

interface NotificationConfig {
  enabled: boolean;
  titlePrefix: string;
  notifyOnResponseComplete: boolean;
  notifyOnApprovalRequired: boolean;
  tools: {
    Notify: boolean;
  };
}

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  titlePrefix: '[Agent] ',
  notifyOnResponseComplete: true,
  notifyOnApprovalRequired: true,
  tools: {
    Notify: true,
  },
};

export async function loadConfig(): Promise<NotificationConfig> {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    
    let config: NotificationConfig;
    
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const parsedConfig = JSON.parse(configData);
      
      config = {
        ...DEFAULT_CONFIG,
        ...parsedConfig,
        tools: {
          ...DEFAULT_CONFIG.tools,
          ...(parsedConfig.tools || {}),
        },
      };
    } else {
      console.warn(`Config file not found at ${configPath}, using default configuration`);
      config = DEFAULT_CONFIG;
      
      try {
        fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
        console.log(`Created default config file at ${configPath}`);
      } catch (writeError) {
        console.warn('Failed to create default config file:', writeError);
      }
    }
    
    const rcConfig = rc('notify-agent-mcp', config);
    
    const finalConfig: NotificationConfig = {
      enabled: Boolean(rcConfig.enabled),
      titlePrefix: String(rcConfig.titlePrefix || DEFAULT_CONFIG.titlePrefix),
      notifyOnResponseComplete: Boolean(rcConfig.notifyOnResponseComplete ?? DEFAULT_CONFIG.notifyOnResponseComplete),
      notifyOnApprovalRequired: Boolean(rcConfig.notifyOnApprovalRequired ?? DEFAULT_CONFIG.notifyOnApprovalRequired),
      tools: {
        Notify: Boolean(rcConfig.tools?.Notify ?? DEFAULT_CONFIG.tools.Notify),
      },
    };
    
    validateConfig(finalConfig);
    
    return finalConfig;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    console.log('Using default configuration as fallback');
    return DEFAULT_CONFIG;
  }
}

function validateConfig(config: NotificationConfig): void {
  if (typeof config.enabled !== 'boolean') {
    throw new Error('Configuration error: "enabled" must be a boolean');
  }
  
  if (typeof config.titlePrefix !== 'string') {
    throw new Error('Configuration error: "titlePrefix" must be a string');
  }
  
  if (!config.tools || typeof config.tools !== 'object') {
    throw new Error('Configuration error: "tools" must be an object');
  }
  
  if (typeof config.tools.Notify !== 'boolean') {
    throw new Error('Configuration error: "tools.Notify" must be a boolean');
  }
  
  if (typeof config.notifyOnResponseComplete !== 'boolean') {
    throw new Error('Configuration error: "notifyOnResponseComplete" must be a boolean');
  }
  
  if (typeof config.notifyOnApprovalRequired !== 'boolean') {
    throw new Error('Configuration error: "notifyOnApprovalRequired" must be a boolean');
  }
}

export function getConfigPath(): string {
  return path.join(process.cwd(), 'config.json');
}

export function createDefaultConfig(): void {
  const configPath = getConfigPath();
  
  if (!fs.existsSync(configPath)) {
    try {
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
      console.log(`Created default configuration file at ${configPath}`);
    } catch (error) {
      console.error('Failed to create default configuration file:', error);
      throw error;
    }
  } else {
    console.log(`Configuration file already exists at ${configPath}`);
  }
}

export { NotificationConfig, DEFAULT_CONFIG };
