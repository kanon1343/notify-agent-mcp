interface NotificationConfig {
    enabled: boolean;
    titlePrefix: string;
    notifyOnResponseComplete: boolean;
    notifyOnApprovalRequired: boolean;
    tools: {
        Notify: boolean;
    };
}
declare const DEFAULT_CONFIG: NotificationConfig;
export declare function loadConfig(): Promise<NotificationConfig>;
export declare function getConfigPath(): string;
export declare function createDefaultConfig(): void;
export { NotificationConfig, DEFAULT_CONFIG };
//# sourceMappingURL=config.d.ts.map