# GitHub Copilot Agent Mode用TypeScript MCPサーバー

GitHub Copilot Agent ModeとVSCodeで動作するmacOSデスクトップ通知機能を提供するTypeScript MCP（Model Context Protocol）サーバーです。

## 概要

このMCPサーバーは、GitHub Copilot Agent Modeの以下のシナリオで自動的にmacOSデスクトップ通知を送信します：

- **エージェント応答完了**: Copilot Agentが応答を完了した時
- **ユーザー承認要求**: Copilot Agentがユーザーの承認を必要とする時
- **エラー発生**: MCPプロトコルやランタイムエラーが発生した時

## GitHub Copilot Agent → macOS通知の仕組み

### 1. MCP通信フロー
```
GitHub Copilot Agent (VSCode) 
    ↓ JSON-RPC over stdio
MCP Server (このプロジェクト)
    ↓ node-notifier
macOS Notification Center
```

### 2. 通知トリガーの詳細

#### エージェント応答完了の検出
```typescript
// MCPサーバーがCopilot Agentからのメッセージを監視
server.setRequestHandler(ListToolsRequestSchema, async () => {
  // ツールリストを返す
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "notify") {
    // 通知ツールが呼び出された時の処理
    await notifyTool.notify(title, message);
  }
});
```

#### 通知送信の実装
```typescript
// notifyTool.ts内での実際の通知送信
import notifier from 'node-notifier';

async notify(title: string, message: string): Promise<void> {
  if (!this.config.enabled || process.platform !== 'darwin') {
    return;
  }
  
  return new Promise((resolve, reject) => {
    notifier.notify({
      title: this.config.titlePrefix + title,
      message: message,
      wait: false,
      sound: true
    }, (error, response) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
```

### 3. VSCodeとの統合方法

1. **MCP設定**: VSCodeのsettings.jsonでMCPサーバーを登録
2. **stdio通信**: 標準入出力経由でJSON-RPCメッセージを交換
3. **ツール呼び出し**: Copilot Agentが`notify`ツールを呼び出し
4. **通知表示**: macOSネイティブ通知として表示

## 機能

### 🔔 通知機能
- macOSネイティブデスクトップ通知（`node-notifier`使用）
- カスタマイズ可能な通知プレフィックス
- 通知タイプ別の自動分類（完了、承認要求、エラー）
- 音声通知サポート

### ⚙️ 設定管理
- JSON設定ファイル（`config.json`）
- RC設定ファイルサポート
- 通知の有効/無効切り替え
- 通知タイプ別の個別制御

### 📝 ログ機能
- 全通知のファイルログ記録
- ログローテーション機能（10MB制限）
- エラーログの詳細記録

### 🔧 エラーハンドリング
- 未処理例外の自動通知
- Promise拒否の自動通知
- 高重要度エラーアラート

## プロジェクト構造

```
project-root/
├── src/
│   ├── index.ts         # MCPサーバーエントリーポイント
│   ├── notifyTool.ts    # 通知ツール実装
│   └── config.ts        # 設定ローダー
├── dist/                # コンパイル済みJavaScript
├── config.json          # ユーザー編集可能設定
├── package.json
└── tsconfig.json
```

## インストール

### 前提条件
- Node.js 18+ (LTS推奨)
- macOS (通知機能はmacOSのみサポート)
- TypeScript

### セットアップ

1. **リポジトリのクローン**
```bash
git clone https://github.com/kanon1343/notify-agent-mcp.git
cd notify-agent-mcp
```

2. **依存関係のインストール**
```bash
npm install
```

3. **TypeScriptのコンパイル**
```bash
npm run build
```

## 設定

### config.json

プロジェクトルートの`config.json`ファイルで通知動作をカスタマイズできます：

```json
{
  "enabled": true,
  "titlePrefix": "[Agent] ",
  "notifyOnResponseComplete": true,
  "notifyOnApprovalRequired": true,
  "tools": {
    "Notify": true
  }
}
```

#### 設定オプション

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `enabled` | boolean | `true` | 通知機能の有効/無効 |
| `titlePrefix` | string | `"[Agent] "` | 通知タイトルのプレフィックス |
| `notifyOnResponseComplete` | boolean | `true` | エージェント応答完了時の通知 |
| `notifyOnApprovalRequired` | boolean | `true` | ユーザー承認要求時の通知 |
| `tools.Notify` | boolean | `true` | Notifyツールの有効/無効 |

## 使用方法

### MCPサーバーの起動

```bash
npm start
```

サーバーはstdio transportでJSON-RPC通信を開始し、GitHub Copilot Agent Modeとの統合準備が完了します。

### VSCode GitHub Copilot Agent Modeとの統合

1. VSCodeでGitHub Copilot Agent Modeを有効化
2. MCPサーバーをCopilot Agentの設定に追加
3. エージェントが応答完了や承認要求を送信すると自動的に通知が表示されます

### 通知の種類

#### 1. エージェント応答完了通知
```
タイトル: [Agent] [COMPLETE] タスク名
メッセージ: Copilot Agent completed: 応答内容
```

#### 2. ユーザー承認要求通知
```
タイトル: [Agent] [APPROVAL REQUIRED] タスク名
メッセージ: User approval required: 承認内容
```

#### 3. エラー通知
```
タイトル: [Agent] [ERROR] エラータイプ
メッセージ: エラーの詳細
```

## 開発

### 開発モード

TypeScriptの変更を監視してリアルタイムコンパイル：

```bash
npm run dev
```

### リント

TypeScriptコードの型チェック：

```bash
npm run lint
```

### ビルド

本番用ビルド：

```bash
npm run build
```

### クリーンアップ

ビルドファイルの削除：

```bash
npm run clean
```

## MCP プロトコル

このサーバーは以下のMCPツールを提供します：

### `notify` ツール

**説明**: macOSデスクトップ通知を送信

**パラメータ**:
- `title` (string, 必須): 通知のタイトル
- `message` (string, 必須): 通知のメッセージ内容

**使用例**:
```json
{
  "name": "notify",
  "arguments": {
    "title": "タスク完了",
    "message": "コードレビューが完了しました"
  }
}
```

## ログ

通知とエラーは以下の場所にログ記録されます：

- **ログファイル**: `{プロジェクトルート}/notify-agent-mcp.log`
- **ログローテーション**: ファイルサイズが10MBを超えると自動ローテーション
- **ログ形式**: `[YYYY-MM-DD HH:mm:ss] [レベル] メッセージ`

## トラブルシューティング

### 通知が表示されない

1. **macOS確認**: このツールはmacOSでのみ動作します
2. **設定確認**: `config.json`で`enabled: true`になっているか確認
3. **権限確認**: macOSの通知権限が許可されているか確認

### MCPサーバー接続エラー

1. **ポート確認**: stdio transportが正しく設定されているか確認
2. **プロセス確認**: サーバープロセスが正常に起動しているか確認
3. **ログ確認**: エラーログでスタックトレースを確認

### 設定が反映されない

1. **ファイル確認**: `config.json`が正しいJSON形式か確認
2. **再起動**: サーバーを再起動して設定を再読み込み
3. **権限確認**: 設定ファイルの読み取り権限を確認

## ライセンス

ISC

## 作成者

このプロジェクトは原田和音 (@kanon1343) の要求により、Devin AIによって実装されました。

**Devin実行リンク**: https://app.devin.ai/sessions/a35f357218504186a32c5deb625a47f5

## 貢献

プルリクエストやイシューの報告を歓迎します。GitHub Copilot Agent Modeとの統合改善や新機能の提案をお待ちしています。
