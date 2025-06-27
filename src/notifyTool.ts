import notifier from 'node-notifier';
import * as fs from 'fs';
import * as path from 'path';

interface NotificationConfig {
  enabled: boolean;
  titlePrefix: string;
  notifyOnResponseComplete: boolean;
  notifyOnApprovalRequired: boolean;
  tools: {
    Notify: boolean;
  };
}

export class NotifyTool {
  private config: NotificationConfig;
  private logFilePath: string;

  constructor(config: NotificationConfig) {
    this.config = config;
    this.logFilePath = path.join(process.cwd(), 'notification.log');
    this.ensureLogFile();
  }

  private ensureLogFile(): void {
    try {
      if (!fs.existsSync(this.logFilePath)) {
        fs.writeFileSync(this.logFilePath, '');
      }
    } catch (error) {
      console.error('Failed to create log file:', error);
    }
  }

  private logToFile(level: string, title: string, message: string): void {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${level}: ${title} - ${message}\n`;
      
      fs.appendFileSync(this.logFilePath, logEntry);
      
      const stats = fs.statSync(this.logFilePath);
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (stats.size > maxSize) {
        this.rotateLogFile();
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private rotateLogFile(): void {
    try {
      const backupPath = this.logFilePath + '.old';
      
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
      
      fs.renameSync(this.logFilePath, backupPath);
      fs.writeFileSync(this.logFilePath, '');
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  async notify(title: string, message: string): Promise<void> {
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
        notifier.notify(
          {
            title: prefixedTitle,
            message: message,
            wait: false,
            sound: true,
          },
          (error, response) => {
            if (error) {
              this.logToFile('ERROR', 'Notification Failed', error.message);
              reject(error);
            } else {
              this.logToFile('SUCCESS', prefixedTitle, `Notification sent successfully: ${message}`);
              resolve();
            }
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logToFile('ERROR', 'Notification Exception', errorMessage);
        reject(new Error(`Failed to send notification: ${errorMessage}`));
      }
    });
  }

  async notifyResponseComplete(title: string, message: string): Promise<void> {
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
        notifier.notify({
          title: completeTitle,
          message: `Copilot Agent completed: ${message}`,
          wait: false,
          sound: true,
        }, (error, response) => {
          if (error) {
            this.logToFile('ERROR', 'Response Complete Notification Failed', error.message);
            reject(error);
          } else {
            this.logToFile('SUCCESS', completeTitle, 'Response complete notification sent');
            resolve();
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logToFile('ERROR', 'Response Complete Exception', errorMessage);
        reject(new Error(`Failed to send response complete notification: ${errorMessage}`));
      }
    });
  }

  async notifyApprovalRequired(title: string, message: string): Promise<void> {
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
        notifier.notify({
          title: approvalTitle,
          message: `User approval required: ${message}`,
          wait: false,
          sound: true,
        }, (error, response) => {
          if (error) {
            this.logToFile('ERROR', 'Approval Required Notification Failed', error.message);
            reject(error);
          } else {
            this.logToFile('SUCCESS', approvalTitle, 'Approval required notification sent');
            resolve();
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logToFile('ERROR', 'Approval Required Exception', errorMessage);
        reject(new Error(`Failed to send approval required notification: ${errorMessage}`));
      }
    });
  }

  notifyError(title: string, message: string): void {
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
      notifier.notify({
        title: errorTitle,
        message: message,
        wait: false,
        sound: true,
      });
    } catch (error) {
      console.error('Failed to send error notification:', error);
      this.logToFile('CRITICAL', 'Error Notification Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
