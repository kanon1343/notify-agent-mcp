"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.loadConfig = loadConfig;
exports.getConfigPath = getConfigPath;
exports.createDefaultConfig = createDefaultConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const rc_1 = __importDefault(require("rc"));
const DEFAULT_CONFIG = {
    enabled: true,
    titlePrefix: '[Agent] ',
    notifyOnResponseComplete: true,
    notifyOnApprovalRequired: true,
    tools: {
        Notify: true,
    },
};
exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
async function loadConfig() {
    try {
        const configPath = path.join(process.cwd(), 'config.json');
        let config;
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
        }
        else {
            console.warn(`Config file not found at ${configPath}, using default configuration`);
            config = DEFAULT_CONFIG;
            try {
                fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
                console.log(`Created default config file at ${configPath}`);
            }
            catch (writeError) {
                console.warn('Failed to create default config file:', writeError);
            }
        }
        const rcConfig = (0, rc_1.default)('notify-agent-mcp', config);
        const finalConfig = {
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
    }
    catch (error) {
        console.error('Failed to load configuration:', error);
        console.log('Using default configuration as fallback');
        return DEFAULT_CONFIG;
    }
}
function validateConfig(config) {
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
function getConfigPath() {
    return path.join(process.cwd(), 'config.json');
}
function createDefaultConfig() {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        try {
            fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
            console.log(`Created default configuration file at ${configPath}`);
        }
        catch (error) {
            console.error('Failed to create default configuration file:', error);
            throw error;
        }
    }
    else {
        console.log(`Configuration file already exists at ${configPath}`);
    }
}
//# sourceMappingURL=config.js.map