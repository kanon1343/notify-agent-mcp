import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";

async function main() {
  // MCPサーバーのインスタンスを作成します
  const server = new McpServer({
    name: "github-copilot-notifier", // ツール名をCopilot用に変更
    version: "1.0.0",
  });

  // GitHub Copilotイベント用のデスクトップ通知ツールを登録します
  server.registerTool(
    "CopilotNotification", // 新しいツール名
    {
      title: "GitHub Copilot Notification Tool", // ツールのタイトルを更新
      description:
        "Shows a macOS desktop notification for GitHub Copilot events and focuses VSCode on click.", // 説明を更新
      inputSchema: {
        message: z.string(), // 通知メッセージ
        activateVSCode: z.boolean().optional().default(true), // VSCodeをアクティブにするかどうかのフラグ
      },
    },
    async ({ message, activateVSCode }) => {
      const safeMessage = message.replace(/"/g, '\\"');
      let script = `display notification \\"${safeMessage}\\" with title \\"GitHub Copilot\\" subtitle \\"Tap to open VSCode\\"`;

      // 通知をクリックしたときにVSCodeをアクティブにするAppleScriptを追加
      // 注意: このスクリプトはVSCodeがインストールされていて、Dockにあるか、最近使われたアプリケーションであることを前提としています。
      // より堅牢な方法としては、VSCodeのバンドルID 'com.microsoft.VSCode' を使うことです。
      if (activateVSCode) {
        script += ` sound name \\"Submarine\\"`; // 通知音を追加（任意）
        // AppleScriptでVSCodeをアクティベート
        const activateScript = `
          tell application "Visual Studio Code"
            activate
          end tell
        `;
        // 通知スクリプトの後にアクティベーションスクリプトを実行する
        // ただし、`display notification` はスクリプトの実行をブロックしないため、
        // 通知をクリックした際の直接的なアクションとしてはosascript単体では難しい。
        // ここでは、通知表示後にVSCodeをアクティブにするように変更します。
        // ユーザーが通知をクリックしたことを検知してVSCodeを前面に出すには、より高度な通知ライブラリや常駐スクリプトが必要です。
        // ここでは簡略化のため、通知表示とほぼ同時にVSCodeをアクティブ化します。
        exec(`osascript -e '${script}' -e '${activateScript.replace(/\n/g, "")}'`);
      } else {
        exec(`osascript -e '${script}'`);
      }

      return {
        content: [
          {
            type: "text",
            text: `Notification shown: ${message}`,
          },
        ],
      };
    }
  );

  // 標準入出力を介してMCPプロトコルをリッスンします
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("サーバーエラー:", err); // エラーメッセージを日本語に
  process.exit(1);
});
