import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './config.js';
import { NotifyTool } from './notifyTool.js';

interface CopilotAgentMessage {
  type: 'response' | 'request';
  content: string;
  approvalRequired?: boolean;
  completed?: boolean;
}

class MCPNotificationServer {
  private server: Server;
  private config: any;
  private notifyTool!: NotifyTool;

  constructor() {
    this.server = new Server(
      {
        name: 'notify-agent-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupErrorHandling();
    this.setupToolHandlers();
  }

  private setupErrorHandling(): void {
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

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.config?.enabled || !this.config?.tools?.Notify) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          'Notifications are disabled in configuration'
        );
      }

      if (request.params.name !== 'notify') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const { title, message } = request.params.arguments as {
        title: string;
        message: string;
      };

      if (!title || !message) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Both title and message are required'
        );
      }

      try {
        const args = request.params.arguments as Record<string, unknown>;
        const copilotMessage = args as unknown as CopilotAgentMessage & {
          title: string;
          message: string;
        };
        
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.notifyTool.notifyError('Notification Error', errorMessage);
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to send notification: ${errorMessage}`
        );
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      this.config = await loadConfig();
      this.notifyTool = new NotifyTool(this.config);
      
      console.log('MCP Notification Server initialized successfully');
      console.log('Configuration:', JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to initialize MCP server:', error);
      process.exit(1);
    }
  }

  private shouldTriggerNotification(message: CopilotAgentMessage): boolean {
    if (message.approvalRequired && this.config.notifyOnApprovalRequired) {
      return true;
    }
    
    if (message.completed && this.config.notifyOnResponseComplete) {
      return true;
    }
    
    return false;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('MCP Notification Server running on stdio transport for GitHub Copilot Agent Mode');
  }
}

async function main(): Promise<void> {
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

export { MCPNotificationServer };
