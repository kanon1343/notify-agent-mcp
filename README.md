# GitHub Copilot MCP Notification Server (macOS)

This project implements a simple MCP (Message CoProcessor) server in TypeScript that listens for notifications from GitHub Copilot (or other tools) and displays them as desktop notifications on macOS using `node-notifier`.

## Features

- Receives notification requests via a POST request to `/notify`.
- Displays native macOS desktop notifications.
- Customizable title, message, sound, icon, and wait behavior via JSON payload.

## Prerequisites

- Node.js (v14 or later recommended)
- npm

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kanon1343/notify-agent-mcp.git
    cd notify-agent-mcp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Usage

1.  **Build the TypeScript code:**
    ```bash
    npm run build
    ```
    This will compile the TypeScript files from `src/` into JavaScript files in the `dist/` directory.

2.  **Start the server:**
    ```bash
    npm start
    ```
    The server will start listening on port 3000 by default (or the port specified by the `PORT` environment variable).

## API

### POST `/notify`

Send a POST request to this endpoint with a JSON payload to trigger a desktop notification.

**Request Body (JSON):**

```json
{
  "title": "Your Notification Title",
  "message": "Your notification message content.",
  "sound": true,
  "icon": "/path/to/your/icon.png",
  "wait": false
}
```

-   `title` (string, required): The title of the notification.
-   `message` (string, required): The main content of the notification.
-   `sound` (boolean, optional, default: `true`): Whether to play a sound with the notification.
-   `icon` (string, optional): Absolute path to an image file (e.g., PNG) to be used as the notification icon.
-   `wait` (boolean, optional, default: `false`): Whether the notification should wait for user interaction before dismissing.

**Example using `curl`:**

```bash
curl -X POST -H "Content-Type: application/json" \
-d '{
  "title": "Copilot Task Completed",
  "message": "Your long-running task has finished successfully!",
  "sound": true
}' \
http://localhost:3000/notify
```

## Development

-   Source files are in the `src` directory.
-   The main server logic is in `src/server.ts`.
-   TypeScript is configured using `tsconfig.json`.

To recompile after making changes:

```bash
npm run build
```
Then restart the server:
```bash
npm start
```

## Note on macOS Permissions

The first time a notification is triggered by this application, macOS may ask for permission for "Terminal" or your code editor/IDE (if running directly from there) or "node" to display notifications. Ensure you grant these permissions.
For a standalone application, you would typically bundle this with something like Electron and sign your app, then the app itself would request notification permissions. For this simple server, the permission request will likely be associated with the process running the Node.js script.