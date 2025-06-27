"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPNotificationServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const config_js_1 = require("./config.js");
const notifyTool_js_1 = require("./notifyTool.js");
class MCPNotificationServer {
    server;
    config;
    notifyTool;
    constructor() {
        this.server = new index_js_1.Server({
            name: 'notify-agent-mcp',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupErrorHandling();
        this.setupToolHandlers();
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Server Error]', error);
            if (this.notifyTool) {
                this.notifyTool.notifyError('MCP Server Error', error.message || 'Unknown error occurred');
            }
        };
        process.on('uncaughtException', (error) => {
            console.error('[Uncaught Exception]', error);
            if (this.notifyTool) {
                this.notifyTool.notifyError('Uncaught Exception', error.message || 'Unknown error occurred');
            }
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('[Unhandled Rejection]', reason);
            if (this.notifyTool) {
                this.notifyTool.notifyError('Unhandled Rejection', String(reason) || 'Unknown promise rejection');
            }
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            if (!this.config?.enabled || !this.config?.tools?.Notify) {
                return { tools: [] };
            }
            return {
                tools: [
                    {
                        name: 'notify',
                        description: 'Send a desktop notification on macOS',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                title: {
                                    type: 'string',
                                    description: 'The title of the notification',
                                },
                                message: {
                                    type: 'string',
                                    description: 'The message content of the notification',
                                },
                            },
                            required: ['title', 'message'],
                        },
                    },
                ],
            };
        });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            if (!this.config?.enabled || !this.config?.tools?.Notify) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, 'Notifications are disabled in configuration');
            }
            if (request.params.name !== 'notify') {
                throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
            }
            const { title, message } = request.params.arguments;
            if (!title || !message) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'Both title and message are required');
            }
            try {
                const args = request.params.arguments;
                const copilotMessage = args;
                const shouldNotify = this.shouldTriggerNotification(copilotMessage);
                if (shouldNotify) {
                    await this.notifyTool.notify(title, message);
                    if (copilotMessage.approvalRequired) {
                        await this.notifyTool.notifyApprovalRequired(title, message);
                    }
                    if (copilotMessage.completed) {
                        await this.notifyTool.notifyResponseComplete(title, message);
                    }
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Notification sent: "${title}" - "${message}"`,
                        },
                    ],
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.notifyTool.notifyError('Notification Error', errorMessage);
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Failed to send notification: ${errorMessage}`);
            }
        });
    }
    async initialize() {
        try {
            this.config = await (0, config_js_1.loadConfig)();
            this.notifyTool = new notifyTool_js_1.NotifyTool(this.config);
            console.log('MCP Notification Server initialized successfully');
            console.log('Configuration:', JSON.stringify(this.config, null, 2));
        }
        catch (error) {
            console.error('Failed to initialize MCP server:', error);
            process.exit(1);
        }
    }
    shouldTriggerNotification(message) {
        if (message.approvalRequired && this.config.notifyOnApprovalRequired) {
            return true;
        }
        if (message.completed && this.config.notifyOnResponseComplete) {
            return true;
        }
        return false;
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.log('MCP Notification Server running on stdio transport for GitHub Copilot Agent Mode');
    }
}
exports.MCPNotificationServer = MCPNotificationServer;
async function main() {
    const server = new MCPNotificationServer();
    await server.initialize();
    await server.run();
}
if (require.main === module) {
    main().catch((error) => {
        console.error('Failed to start MCP server:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map