declare class MCPNotificationServer {
    private server;
    private config;
    private notifyTool;
    constructor();
    private setupErrorHandling;
    private setupToolHandlers;
    initialize(): Promise<void>;
    private shouldTriggerNotification;
    run(): Promise<void>;
}
export { MCPNotificationServer };
//# sourceMappingURL=index.d.ts.map