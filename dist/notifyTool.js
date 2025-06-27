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
exports.NotifyTool = void 0;
const node_notifier_1 = __importDefault(require("node-notifier"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class NotifyTool {
    config;
    logFilePath;
    constructor(config) {
        this.config = config;
        this.logFilePath = path.join(process.cwd(), 'notification.log');
        this.ensureLogFile();
    }
    ensureLogFile() {
        try {
            if (!fs.existsSync(this.logFilePath)) {
                fs.writeFileSync(this.logFilePath, '');
            }
        }
        catch (error) {
            console.error('Failed to create log file:', error);
        }
    }
    logToFile(level, title, message) {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] ${level}: ${title} - ${message}\n`;
            fs.appendFileSync(this.logFilePath, logEntry);
            const stats = fs.statSync(this.logFilePath);
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (stats.size > maxSize) {
                this.rotateLogFile();
            }
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    rotateLogFile() {
        try {
            const backupPath = this.logFilePath + '.old';
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
            }
            fs.renameSync(this.logFilePath, backupPath);
            fs.writeFileSync(this.logFilePath, '');
        }
        catch (error) {
            console.error('Failed to rotate log file:', error);
        }
    }
    async notify(title, message) {
        if (!this.config.enabled || !this.config.tools.Notify) {
            throw new Error('Notifications are disabled in configuration');
        }
        const prefixedTitle = this.config.titlePrefix + title;
        this.logToFile('INFO', prefixedTitle, message);
        return new Promise((resolve, reject) => {
            if (process.platform !== 'darwin') {
                const error = new Error('This notification tool only supports macOS');
                this.logToFile('ERROR', 'Platform Error', error.message);
                reject(error);
                return;
            }
            try {
                node_notifier_1.default.notify({
                    title: prefixedTitle,
                    message: message,
                    wait: false,
                    sound: true,
                }, (error, response) => {
                    if (error) {
                        this.logToFile('ERROR', 'Notification Failed', error.message);
                        reject(error);
                    }
                    else {
                        this.logToFile('SUCCESS', prefixedTitle, `Notification sent successfully: ${message}`);
                        resolve();
                    }
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logToFile('ERROR', 'Notification Exception', errorMessage);
                reject(new Error(`Failed to send notification: ${errorMessage}`));
            }
        });
    }
    async notifyResponseComplete(title, message) {
        if (!this.config.enabled || !this.config.notifyOnResponseComplete) {
            return;
        }
        const completeTitle = this.config.titlePrefix + '[COMPLETE] ' + title;
        this.logToFile('COMPLETE', completeTitle, message);
        if (process.platform !== 'darwin') {
            console.log('Response complete notification skipped - macOS only:', completeTitle, message);
            return;
        }
        return new Promise((resolve, reject) => {
            try {
                node_notifier_1.default.notify({
                    title: completeTitle,
                    message: `Copilot Agent completed: ${message}`,
                    wait: false,
                    sound: true,
                }, (error, response) => {
                    if (error) {
                        this.logToFile('ERROR', 'Response Complete Notification Failed', error.message);
                        reject(error);
                    }
                    else {
                        this.logToFile('SUCCESS', completeTitle, 'Response complete notification sent');
                        resolve();
                    }
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logToFile('ERROR', 'Response Complete Exception', errorMessage);
                reject(new Error(`Failed to send response complete notification: ${errorMessage}`));
            }
        });
    }
    async notifyApprovalRequired(title, message) {
        if (!this.config.enabled || !this.config.notifyOnApprovalRequired) {
            return;
        }
        const approvalTitle = this.config.titlePrefix + '[APPROVAL REQUIRED] ' + title;
        this.logToFile('APPROVAL', approvalTitle, message);
        if (process.platform !== 'darwin') {
            console.log('Approval required notification skipped - macOS only:', approvalTitle, message);
            return;
        }
        return new Promise((resolve, reject) => {
            try {
                node_notifier_1.default.notify({
                    title: approvalTitle,
                    message: `User approval required: ${message}`,
                    wait: false,
                    sound: true,
                }, (error, response) => {
                    if (error) {
                        this.logToFile('ERROR', 'Approval Required Notification Failed', error.message);
                        reject(error);
                    }
                    else {
                        this.logToFile('SUCCESS', approvalTitle, 'Approval required notification sent');
                        resolve();
                    }
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logToFile('ERROR', 'Approval Required Exception', errorMessage);
                reject(new Error(`Failed to send approval required notification: ${errorMessage}`));
            }
        });
    }
    notifyError(title, message) {
        if (!this.config.enabled) {
            return;
        }
        const errorTitle = this.config.titlePrefix + '[ERROR] ' + title;
        this.logToFile('ERROR', errorTitle, message);
        if (process.platform !== 'darwin') {
            console.error('Error notification skipped - macOS only:', errorTitle, message);
            return;
        }
        try {
            node_notifier_1.default.notify({
                title: errorTitle,
                message: message,
                wait: false,
                sound: true,
            });
        }
        catch (error) {
            console.error('Failed to send error notification:', error);
            this.logToFile('CRITICAL', 'Error Notification Failed', error instanceof Error ? error.message : 'Unknown error');
        }
    }
}
exports.NotifyTool = NotifyTool;
//# sourceMappingURL=notifyTool.js.map