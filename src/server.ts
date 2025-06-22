import express, { Request, Response } from 'express';
import notifier from 'node-notifier';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

interface NotificationPayload {
  title: string;
  message: string;
  sound?: boolean; // Optional
  icon?: string; // Optional, path to icon
  wait?: boolean; // Optional, wait for user interaction
}

app.post('/notify', (req: Request, res: Response) => {
  const payload = req.body as NotificationPayload;

  if (!payload.title || !payload.message) {
    return res.status(400).json({ error: 'Missing title or message in payload' });
  }

  notifier.notify(
    {
      title: payload.title,
      message: payload.message,
      sound: payload.sound !== undefined ? payload.sound : true, // Play sound by default
      icon: payload.icon ? path.resolve(payload.icon) : undefined, // Resolve path if icon is provided
      wait: payload.wait !== undefined ? payload.wait : false, // Don't wait by default
      appName: 'GitHub Copilot MCP' // Added appName for clarity on macOS
    },
    (err, response) => {
      if (err) {
        console.error('Notification error:', err);
        return res.status(500).json({ error: 'Failed to send notification' });
      }
      console.log('Notification sent:', response);
      res.status(200).json({ success: true, response });
    }
  );
});

app.listen(port, () => {
  console.log(`MCP Server listening on port ${port}`);
});
