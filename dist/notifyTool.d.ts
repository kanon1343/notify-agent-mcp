interface NotificationConfig {
    enabled: boolean;
    titlePrefix: string;
    notifyOnResponseComplete: boolean;
    notifyOnApprovalRequired: boolean;
    tools: {
        Notify: boolean;
    };
}
export declare class NotifyTool {
    private config;
    private logFilePath;
    constructor(config: NotificationConfig);
    private ensureLogFile;
    private logToFile;
    private rotateLogFile;
    notify(title: string, message: string): Promise<void>;
    notifyResponseComplete(title: string, message: string): Promise<void>;
    notifyApprovalRequired(title: string, message: string): Promise<void>;
    notifyError(title: string, message: string): void;
}
export {};
//# sourceMappingURL=notifyTool.d.ts.map