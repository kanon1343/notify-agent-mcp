# GitHub Copilot macOS Notifier Agent (MCP)

これは、GitHub Copilot のイベント（タスク完了、ユーザーアクションが必要な場合など）が発生した際に、macOS上でデスクトップ通知を表示するためのModel Context Protocol (MCP)サーバーです。通知をクリックする（または通知表示とほぼ同時に）、Visual Studio Codeが前面に表示されるよう試みます。

## 機能

- GitHub Copilotからのイベントに基づいてmacOSデスクトップ通知を表示します。
- 通知タイトルは「GitHub Copilot」として表示されます。
- 通知にはイベントに応じたメッセージが表示されます。
- （オプション）通知表示後、Visual Studio Codeアプリケーションをアクティブ化しようとします。

## 前提条件

- macOS環境
- Node.js および npm がインストールされていること
- Visual Studio Code がインストールされていること

## セットアップと実行

1.  **リポジトリをクローンします（まだの場合）：**
    ```bash
    git clone <repository-url>
    cd notify-agent-mcp
    ```

2.  **依存関係をインストールします：**
    ```bash
    npm install
    ```
    *注意：現在のサンドボックス環境では `npm install` の動作に問題があり、テストが実行できませんでした。ローカル環境で試す場合は、これが正常に動作するはずです。*

3.  **エージェントを実行します：**
    ```bash
    npm start
    ```
    これにより、MCPサーバーが標準入出力を介してリッスンを開始します。

## MCPツール： `CopilotNotification`

このエージェントは `CopilotNotification` という名前の単一のMCPツールを公開します。

### 入力スキーマ

-   `message` (string,必須): 通知に表示するテキストメッセージ。
-   `activateVSCode` (boolean, オプション, デフォルト: `true`): `true`の場合、通知表示後にVSCodeをアクティブにしようとします。

### 使用例 (MCPクライアントからの呼び出し想定)

```json
{
  "toolName": "CopilotNotification",
  "inputs": {
    "message": "Copilotが提案を完了しました。",
    "activateVSCode": true
  }
}
```

## 開発とテスト

-   ソースコード: `src/main.ts`
-   テスト: `tests/main.test.ts` (現在、環境の問題で実行不可)
    ```bash
    npm test
    ```

## 注意事項

-   VSCodeのアクティベーションは、`osascript` を使用して `Visual Studio Code.app` をアクティブにすることで行われます。VSCodeが期待通りに起動しない場合、アプリケーション名やインストール状況を確認してください。
-   `osascript` の `display notification` コマンドの制限により、通知を「クリック」した瞬間に特定のアクションを正確に実行することは困難です。現在の実装では、`activateVSCode` が `true` の場合、通知が表示された直後にVSCodeをアクティブ化しようとします。

## TODO

-   よりインタラクティブな通知（例：通知内のボタンに直接反応する）のため、`node-notifier`のようなライブラリの利用を検討する。
-   テスト環境の問題を解決し、堅牢なテストスイートを確立する。