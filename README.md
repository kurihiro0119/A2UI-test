# A2UI チュートリアルアプリ

A2UI（Agent-Driven Interfaces）を理解するためのチュートリアルアプリケーションです。

## A2UI とは？

A2UI は、AI エージェントがリッチでインタラクティブなユーザーインターフェースを生成するためのプロトコルです。

### 主な特徴

- **セキュア**: 宣言的なデータ形式で、実行可能なコードではないため安全
- **LLM フレンドリー**: ストリーミング JSON 構造で、LLM が段階的に UI を生成可能
- **フレームワーク非依存**: 同じ UI を Angular、Flutter、React などでレンダリング可能
- **プログレッシブレンダリング**: UI 更新をストリーミングで配信し、リアルタイムで表示

### 従来の課題

テキストベースのチャットでは、複雑な情報入力に何度も往復が必要でした。例えばレストラン予約の場合：

1. ユーザー: 「レストラン予約したい」
2. エージェント: 「いつですか？」
3. ユーザー: 「明日」
4. エージェント: 「何時ですか？」
5. ...（続く）

A2UI を使えば、エージェントが一度にフォーム（日付ピッカー、時間セレクタ、人数入力など）を生成し、ユーザーは直感的に操作できます。

## プロジェクト構成

```
A2UI-test/
├── server/           # サーバーサイド（エージェント）
│   └── index.js     # A2UIメッセージを生成するエージェント
├── client/           # クライアントサイド（React）
│   ├── src/
│   │   ├── App.js   # メインアプリケーション
│   │   └── components/
│   │       ├── A2UIRenderer.js  # A2UIメッセージをレンダリング
│   │       └── ChatInput.js     # チャット入力コンポーネント
│   └── package.json
└── package.json
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm run install:all
```

### 2. OpenAI API Key の設定

1. [OpenAI Platform](https://platform.openai.com/api-keys) で API Key を取得
2. プロジェクトルートに `.env` ファイルを作成：

```bash
# .env.example をコピーして .env を作成
cp .env.example .env

# または手動で .env ファイルを作成
# .env ファイル
OPENAI_API_KEY=sk-your-api-key-here
PORT=3001
```

**注意**: `.env` ファイルは `.gitignore` に含まれているため、Git にコミットされません。

または環境変数として設定：

```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

### 3. サーバーの起動

```bash
npm run server
```

サーバーは `http://localhost:3001` で起動します。

### 4. クライアントの起動

別のターミナルで：

```bash
npm run client
```

クライアントは `http://localhost:3000` で起動します。

### 5. 両方を同時に起動

```bash
npm run dev
```

## 使い方

1. ブラウザで `http://localhost:3000` を開く
2. チャット入力欄に**自然言語で**メッセージを入力
3. **OpenAI API（GPT-4o-mini）が自然言語を理解し、A2UI 形式の JSON を生成**
4. 右側に生成された UI が表示される

### 試せるメッセージ例（自然言語で OK！）

- **「レストラン予約したい」** → 予約フォーム（日付、時間、人数、名前、メール）が自動生成
- **「タスク管理アプリを作りたい」** → タスク入力フォームが自動生成
- **「連絡先を登録したい」** → 名前、電話番号、メールのフォームが自動生成
- **「商品を検索したい」** → 検索入力フィールドと検索ボタンが自動生成
- **「イベント参加申し込み」** → イベント申し込みフォームが自動生成
- **「アンケートに答えたい」** → アンケートフォームが自動生成

**重要**: どんな自然言語でも試せます！LLM が意図を理解して適切な UI を生成します。

## A2UI メッセージの構造

A2UI メッセージは以下の構造を持ちます：

```json
{
  "type": "a2ui",
  "version": "0.8",
  "surface": {
    "id": "main",
    "components": [
      {
        "id": "input-1",
        "type": "input",
        "inputType": "text",
        "label": "名前",
        "binding": "form.name"
      }
    ]
  },
  "data": {
    "form": {
      "name": ""
    }
  }
}
```

### コンポーネントタイプ

- **text**: テキスト表示
- **input**: 入力フィールド（text, date, time, number, email など）
- **button**: ボタン（アクションをトリガー）

### データバインディング

`binding`プロパティで、コンポーネントとデータを紐付けます。例：`"binding": "reservation.date"`

## A2UI の限界と設計思想

### ⚠️ 重要な理解: A2UI は「構造」を生成するだけ

A2UI は**UI の構造（何を表示するか）**を生成できますが、**UI の挙動（どう動くか）**は開発者が事前に定義する必要があります。

#### ✅ LLM が生成できるもの（構造）

- どのコンポーネントを使うか（`type: "input"`, `type: "button"` など）
- コンポーネントの配置と順序
- ラベル、プレースホルダー、スタイル
- データバインディングのパス（`binding: "reservation.date"`）

#### ❌ LLM が生成できないもの（挙動）

- コンポーネントタイプ自体（`text`, `input`, `button` はクライアント側で定義済み）
- ボタンクリック時の処理（`onClick` の実装）
- バリデーションロジック
- API 呼び出しの実装
- 状態管理のロジック

### 具体例で理解する

**LLM が生成する JSON:**

```json
{
  "type": "button",
  "text": "予約を確定",
  "action": "submit_reservation" // ← これは文字列だけ
}
```

**開発者が実装する挙動:**

```69:79:client/src/components/A2UIRenderer.js
case 'button':
  return (
    <button
      key={component.id}
      className="a2ui-button"
      style={component.style}
      onClick={() => onAction(component.action, data)}  // ← 実際の処理は開発者が実装
    >
      {component.text}
    </button>
  );
```

**サーバー側での処理:**

```230:280:server/index.js
app.post("/api/action", async (req, res) => {
  const { action, data } = req.body;

  console.log("🎯 アクション受信:", {
    action,
    data: JSON.stringify(data, null, 2),
  });

  // ... アクションに応じた処理を開発者が実装
  if (action === "submit_reservation") {
    // 予約処理の実装
  }
});
```

### A2UI の真の価値

A2UI の価値は「完全に自由な UI を生成する」ことではなく：

1. **LLM が「どんなフォームが必要か」を理解して構造を生成**

   - 「レストラン予約」→ 日付、時間、人数、名前、メールのフォーム
   - 開発者が全てのパターンを事前定義する必要がない

2. **開発者は「どう動くか」だけを実装**

   - コンポーネントの挙動は一度実装すれば、LLM が生成した構造で自動的に動作
   - 新しいフォームパターンが来ても、コード変更不要

3. **セキュリティ**
   - LLM は実行可能なコードを生成しない
   - 許可されたコンポーネントとアクションのみ使用可能

### まとめ

| 項目                 | LLM が生成 | 開発者が実装 |
| -------------------- | ---------- | ------------ |
| コンポーネントの種類 | ❌         | ✅           |
| コンポーネントの配置 | ✅         | ❌           |
| ラベル・スタイル     | ✅         | ❌           |
| クリック時の処理     | ❌         | ✅           |
| バリデーション       | ❌         | ✅           |
| API 呼び出し         | ❌         | ✅           |

**A2UI = 構造の生成（LLM） + 挙動の実装（開発者）**

## 実際のところ、A2UI はどれくらい便利なのか？

### 正直な評価

**結論**: A2UI は「魔法のツール」ではありません。特定のユースケースでは便利ですが、全ての場面で最適とは限りません。

### ✅ A2UI が便利な場面

1. **動的なフォーム生成が必要な場合**

   - ユーザーの要求に応じて、様々なフォームパターンが必要
   - 例: カスタマーサポートチャットボット、動的なアンケート生成
   - **従来**: 全てのパターンを事前定義する必要がある
   - **A2UI**: LLM が動的に生成

2. **プロトタイピングやデモ**

   - 素早く UI を試したい
   - 例: 「こんなフォームを作りたい」をすぐに確認
   - **従来**: コードを書いて、コンポーネントを配置
   - **A2UI**: 自然言語で指示するだけ

3. **AI エージェントとの対話型 UI**
   - エージェントがユーザーの意図を理解して UI を提案
   - 例: 「レストラン予約したい」→ エージェントが予約フォームを生成
   - **従来**: エージェントはテキストで説明するだけ
   - **A2UI**: 実際に操作できる UI を生成

### ❌ A2UI が不要・不便な場面

1. **固定された UI パターン**

   - 同じフォームを何度も使う
   - 例: ログインフォーム、会員登録フォーム
   - **従来**: 一度定義すれば使い回せる
   - **A2UI**: 毎回 LLM を呼び出す必要があり、コストとレイテンシがかかる

2. **複雑なビジネスロジック**

   - バリデーション、条件分岐、状態管理が複雑
   - 例: 多段階フォーム、依存関係のあるフィールド
   - **従来**: コードで明確に制御できる
   - **A2UI**: 構造は生成できるが、ロジックは開発者が実装する必要がある

3. **パフォーマンスが重要な場合**
   - 高速なレスポンスが必要
   - 例: リアルタイム検索、インクリメンタル入力
   - **従来**: クライアント側で即座に処理
   - **A2UI**: LLM API 呼び出しのレイテンシがある

### 実際の開発コスト比較

#### 従来の方法（React で直接実装）

```jsx
// レストラン予約フォームを実装
function ReservationForm() {
  return (
    <form>
      <input type="date" name="date" />
      <input type="time" name="time" />
      <input type="number" name="guests" />
      <input type="text" name="name" />
      <input type="email" name="email" />
      <button onClick={handleSubmit}>予約</button>
    </form>
  );
}
```

**コスト**:

- 開発時間: 10-30 分（フォームの種類による）
- 実行コスト: ほぼゼロ（クライアント側のみ）
- メンテナンス: フォームごとにコードが必要

#### A2UI を使う場合

**コスト**:

- 開発時間: 初回セットアップ（レンダラー実装）に数時間
- 実行コスト: LLM API 呼び出し（1 回あたり $0.001-0.01 程度）
- レイテンシ: 1-3 秒（LLM の生成時間）
- メンテナンス: レンダラーは一度実装すれば、新しいフォームパターンでもコード変更不要

### 現実的な使い分け

| ケース                             | 従来の方法      | A2UI           |
| ---------------------------------- | --------------- | -------------- |
| 固定フォーム（ログイン、登録）     | ✅ 推奨         | ❌ 不要        |
| 動的フォーム（カスタムアンケート） | ❌ 困難         | ✅ 便利        |
| プロトタイピング                   | ⚠️ 時間がかかる | ✅ 素早い      |
| 本番環境の固定 UI                  | ✅ 推奨         | ❌ コスト高    |
| AI エージェントとの対話            | ❌ テキストのみ | ✅ UI 生成可能 |

### まとめ: A2UI の価値は「選択肢が増えた」こと

A2UI は「全ての UI 開発を置き換える」ものではなく、「動的な UI 生成が必要な場面での選択肢」です。

**従来**: 固定 UI しか作れない  
**A2UI 後**: 固定 UI（従来通り） + 動的 UI（A2UI）の両方が選択可能

**つまり**: 便利な場面は限定的だが、その場面では確かに便利。

## A2UI の良さをコードベースで理解する

このプロジェクトのコードを見ることで、A2UI の利点が実際にどう実現されているかが分かります。

### 1. セキュア: 実行可能なコードではなく、宣言的なデータのみ

**従来の危険な方法（実行しない）:**

```javascript
// ❌ 危険: エージェントが任意のコードを送信
eval(userGeneratedCode); // XSS攻撃のリスク
```

**A2UI の安全な方法:**

```39:120:server/index.js
function generateReservationForm() {
  return {
    type: 'a2ui',
    version: '0.8',
    surface: {
      id: 'main',
      components: [
        {
          id: 'date-picker',
          type: 'input',
          inputType: 'date',
          label: '予約日',
          binding: 'reservation.date',
          required: true
        },
        // ... 他のコンポーネント
      ]
    },
    data: {
      reservation: {
        date: '',
        time: '',
        guests: 2,
        name: '',
        email: ''
      }
    }
  };
}
```

エージェントは**JSON オブジェクト**を返すだけ。クライアント側で安全にレンダリングされます。実行可能なコードは一切送信されません。

### 2. LLM フレンドリー: シンプルで段階的に生成可能な構造

**ストリーミング対応:**

```24:47:client/src/App.js
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'a2ui') {
          setUiState(data);
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }
  }
}
```

LLM は完全な JSON を一度に生成する必要がありません。コンポーネントを**段階的に追加**しながらストリーミングできます。フラットな JSON 構造なので、LLM が生成しやすいです。

### 3. フレームワーク非依存: 同じメッセージを様々なフレームワークでレンダリング

**React レンダラー（このプロジェクト）:**

```35:88:client/src/components/A2UIRenderer.js
const renderComponent = (component) => {
  switch (component.type) {
    case 'text':
      return (
        <div
          key={component.id}
          className="a2ui-text"
          style={component.style}
        >
          {component.text}
        </div>
      );

    case 'input':
      const value = getValue(component.binding);
      return (
        <div key={component.id} className="a2ui-input-group">
          <label className="a2ui-label">
            {component.label}
            {component.required && <span className="required">*</span>}
          </label>
          <input
            type={component.inputType || 'text'}
            value={value}
            onChange={(e) => handleInputChange(component.binding, e.target.value)}
            // ...
          />
        </div>
      );
    // ...
  }
};
```

同じ A2UI メッセージを、Angular、Flutter、Vue など**異なるフレームワーク**でレンダリングできます。エージェント側のコードは変更不要です。

### 4. 自動データバインディング: 宣言的なバインディングで状態管理が簡単

**バインディングの実装:**

```7:33:client/src/components/A2UIRenderer.js
const handleInputChange = (binding, value) => {
  const keys = binding.split('.');
  setData(prev => {
    const newData = { ...prev };
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    return newData;
  });
};

const getValue = (binding) => {
  const keys = binding.split('.');
  let value = data;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return '';
  }
  return value;
};
```

`binding: 'reservation.date'` と指定するだけで、自動的にデータと UI が紐付けられます。手動で状態管理する必要がありません。

### 5. 責務の分離: エージェントは UI 構造を、クライアントはレンダリングを担当

**エージェント側（サーバー）:**

```21:33:server/index.js
if (message.toLowerCase().includes('予約') || message.toLowerCase().includes('レストラン')) {
  const a2uiMessage = generateReservationForm();
  res.write(`data: ${JSON.stringify(a2uiMessage)}\n\n`);
} else if (message.toLowerCase().includes('天気') || message.toLowerCase().includes('weather')) {
  const a2uiMessage = generateWeatherForm();
  res.write(`data: ${JSON.stringify(a2uiMessage)}\n\n`);
} else {
  const a2uiMessage = generateGreetingUI(message);
  res.write(`data: ${JSON.stringify(a2uiMessage)}\n\n`);
}
```

エージェントは**「何を表示するか」**だけを決定します。スタイリングやレイアウトの詳細はクライアント側で制御できます。

**クライアント側（レンダラー）:**

```94:98:client/src/components/A2UIRenderer.js
return (
  <div className="a2ui-renderer">
    {surface.components.map(component => renderComponent(component))}
  </div>
);
```

クライアントは**「どう表示するか」**を担当します。ブランドのスタイルガイドに合わせて、同じ A2UI メッセージを異なる見た目で表示できます。

### 6. プログレッシブレンダリング: ユーザーは待たずに UI が構築される

```38:40:client/src/App.js
if (data.type === 'a2ui') {
  setUiState(data);
  setMessages(prev => [...prev, { type: 'agent', text: 'UIを生成しました' }]);
}
```

エージェントが UI を生成する過程で、**リアルタイムに更新**されます。ユーザーは完全なレスポンスを待つ必要がありません。

## 実装のポイント

### サーバーサイド（エージェント）

- `/api/chat`: ユーザーメッセージを受け取り、A2UI メッセージを生成
- `/api/action`: UI からのアクション（ボタンクリックなど）を処理

### クライアントサイド（レンダラー）

- `A2UIRenderer`: A2UI メッセージを解析し、React コンポーネントに変換
- データバインディングを実装し、入力値の変更を追跡
- アクション（ボタンクリックなど）をサーバーに送信

## コード実装の詳細

### サーバーサイド: OpenAI API との統合

#### 1. OpenAI クライアントの初期化

```9:18:server/index.js
// OpenAI APIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "⚠️  OPENAI_API_KEYが設定されていません。環境変数を設定してください。"
  );
}
```

環境変数から API Key を読み込み、OpenAI クライアントを初期化します。

#### 2. A2UI 仕様のプロンプト定義

```23:66:server/index.js
// A2UI仕様の説明（プロンプトに含める）
const A2UI_SPEC = `
A2UIは、AIエージェントがUIを生成するためのプロトコルです。
以下のJSON形式で応答してください：

{
  "type": "a2ui",
  "version": "0.8",
  "surface": {
    "id": "main",
    "components": [
      {
        "id": "unique-id",
        "type": "text" | "input" | "button",
        // textの場合:
        "text": "表示するテキスト",
        "style": { "fontSize": "18px", ... },
        // inputの場合:
        "inputType": "text" | "date" | "time" | "number" | "email" | "tel",
        "label": "ラベル",
        "placeholder": "プレースホルダー（任意）",
        "binding": "data.field.path",
        "required": true/false,
        "min": 数値（任意）,
        "max": 数値（任意）,
        // buttonの場合:
        "text": "ボタンのテキスト",
        "action": "action_name",
        "style": { "backgroundColor": "#4285f4", ... }
      }
    ]
  },
  "data": {
    // 初期データ（bindingで参照される）
  }
}

利用可能なコンポーネントタイプ:
- text: テキスト表示
- input: 入力フィールド（inputTypeで種類を指定）
- button: ボタン（actionでアクション名を指定）

重要: JSONのみを返してください。説明文は不要です。
`;
```

LLM に A2UI の仕様を理解させるためのプロンプトです。これにより、LLM が正しい形式の JSON を生成できます。

#### 3. ストリーミングで A2UI メッセージを生成

```68:102:server/index.js
// A2UIメッセージを生成するエージェント（OpenAI API使用）
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEYが設定されていません。環境変数を設定してください。",
    });
  }

  // ストリーミングレスポンスの設定
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const systemPrompt = `あなたはA2UIプロトコルを使ってUIを生成するAIエージェントです。
ユーザーの要求に応じて、適切なフォームやUIをA2UI形式のJSONで生成してください。

${A2UI_SPEC}

例:
- 「レストラン予約したい」→ 予約フォーム（日付、時間、人数、名前、メール）
- 「タスク管理アプリを作りたい」→ タスク入力フォーム
- 「連絡先を登録したい」→ 名前、電話番号、メールのフォーム
- 「商品を検索したい」→ 検索入力フィールドと検索ボタン

ユーザーの意図を理解し、必要なフィールドを含む適切なUIを生成してください。`;

    const userPrompt = `ユーザーの要求: "${message}"

上記の要求に応じて、A2UI形式のJSONを生成してください。
JSONのみを返してください。説明やコメントは不要です。`;

    // OpenAI APIでストリーミング生成
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini", // または 'gpt-4', 'gpt-3.5-turbo'
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      stream: true,
      response_format: { type: "json_object" }, // JSON形式を強制
    });
```

**重要なポイント**:

- `stream: true` でストリーミング生成を有効化
- `response_format: { type: "json_object" }` で JSON 形式を強制
- `systemPrompt` に A2UI 仕様を含めることで、LLM が正しい形式を生成

#### 4. ストリーミングデータの処理と JSON パース

````104:150:server/index.js
    let fullResponse = "";
    let jsonBuffer = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        jsonBuffer += content;

        // JSONの完了を試みる（簡易版）
        // 実際の実装では、より堅牢なJSONパーシングが必要
        try {
          // バッファからJSONを抽出（コードブロックがあれば除去）
          let jsonString = jsonBuffer.trim();

          // ```json や ``` を除去
          jsonString = jsonString
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/, "")
            .replace(/\s*```\s*$/, "");

          // JSONをパースしてA2UIメッセージとして送信
          const parsed = JSON.parse(jsonString);
          if (parsed.type === "a2ui") {
            res.write(`data: ${JSON.stringify(parsed)}\n\n`);
            jsonBuffer = ""; // 送信済みなのでクリア
          }
        } catch (e) {
          // JSONがまだ不完全な場合、続きを待つ
        }
      }
    }

    // ストリーミング終了後、最終的なJSONを送信
    try {
      let finalJson = fullResponse.trim();
      finalJson = finalJson
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```\s*$/, "");
      const finalParsed = JSON.parse(finalJson);
      if (finalParsed.type === "a2ui") {
        res.write(`data: ${JSON.stringify(finalParsed)}\n\n`);
      }
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Response:", fullResponse);
      // フォールバック: エラーメッセージを送信
      res.write(
        `data: ${JSON.stringify({
          type: "a2ui",
          version: "0.8",
          surface: {
            id: "main",
            components: [
              {
                id: "error",
                type: "text",
                text: "UIの生成に失敗しました。もう一度お試しください。",
                style: { color: "#ea4335" },
              },
            ],
          },
          data: {},
        })}\n\n`
      );
    }
````

**処理の流れ**:

1. ストリーミングチャンクを逐次受信
2. JSON が完成したらパースを試行
3. A2UI 形式が確認できたら、SSE（Server-Sent Events）形式でクライアントに送信
4. エラー時はフォールバック UI を送信

### クライアントサイド: A2UI レンダラー

#### 1. ストリーミングレスポンスの受信

```24:47:client/src/App.js
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'a2ui') {
          setUiState(data);
          setMessages(prev => [...prev, { type: 'agent', text: 'UIを生成しました' }]);
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }
  }
}
```

**処理の流れ**:

1. `ReadableStream` からデータを読み取り
2. SSE 形式（`data: {...}`）の行を抽出
3. JSON をパースして UI 状態を更新
4. リアルタイムに UI が更新される

#### 2. コンポーネントタイプによる分岐レンダリング

```35:88:client/src/components/A2UIRenderer.js
const renderComponent = (component) => {
  switch (component.type) {
    case 'text':
      return (
        <div
          key={component.id}
          className="a2ui-text"
          style={component.style}
        >
          {component.text}
        </div>
      );

    case 'input':
      const value = getValue(component.binding);
      return (
        <div key={component.id} className="a2ui-input-group">
          <label className="a2ui-label">
            {component.label}
            {component.required && <span className="required">*</span>}
          </label>
          <input
            type={component.inputType || 'text'}
            value={value}
            onChange={(e) => handleInputChange(component.binding, e.target.value)}
            placeholder={component.placeholder}
            min={component.min}
            max={component.max}
            required={component.required}
            className="a2ui-input"
          />
        </div>
      );

    case 'button':
      return (
        <button
          key={component.id}
          className="a2ui-button"
          style={component.style}
          onClick={() => onAction(component.action, data)}
        >
          {component.text}
        </button>
      );

    default:
      return (
        <div key={component.id} className="a2ui-unknown">
          不明なコンポーネントタイプ: {component.type}
        </div>
      );
  }
};
```

**重要なポイント**:

- `component.type` で分岐し、対応する React コンポーネントを返す
- `input` タイプは `binding` でデータと紐付け
- `button` タイプは `action` でアクションをトリガー
- 未定義のタイプは安全に無視される（セキュリティ）

#### 3. データバインディングの実装

```7:33:client/src/components/A2UIRenderer.js
const handleInputChange = (binding, value) => {
  const keys = binding.split('.');
  setData(prev => {
    const newData = { ...prev };
    let current = newData;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    return newData;
  });
};

const getValue = (binding) => {
  const keys = binding.split('.');
  let value = data;
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) return '';
  }
  return value;
};
```

**データバインディングの仕組み**:

- `binding: 'reservation.date'` → `data.reservation.date` にアクセス
- `handleInputChange`: 入力値の変更をネストされたオブジェクトに反映
- `getValue`: ネストされたパスから値を取得

**例**:

```javascript
// binding: "reservation.date"
// data: { reservation: { date: "2024-01-15" } }
// → "2024-01-15" を取得

// ユーザーが "2024-01-20" を入力
// → data.reservation.date = "2024-01-20" に更新
```

#### 4. アクション処理

```56:80:client/src/App.js
const handleAction = async (action, data) => {
  try {
    const response = await fetch('/api/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });

    const result = await response.json();

    if (result.type === 'a2ui') {
      // 新しいUIを表示
      setUiState(result);
    } else if (result.success) {
      // 成功メッセージを表示
      setMessages(prev => [...prev, { type: 'agent', text: result.message }]);
      alert(result.message);
    }
  } catch (error) {
    console.error('Action error:', error);
    alert('アクションの処理中にエラーが発生しました');
  }
};
```

**処理の流れ**:

1. ボタンクリック時に `action` と `data` をサーバーに送信
2. サーバーが新しい A2UI メッセージを返す場合、UI を更新
3. 成功メッセージの場合は、チャットに表示

### データフロー全体

```
1. ユーザー入力
   "レストラン予約したい"
   ↓
2. クライアント → サーバー
   POST /api/chat { message: "..." }
   ↓
3. サーバー → OpenAI API
   systemPrompt + userPrompt
   ↓
4. OpenAI API → サーバー（ストリーミング）
   A2UI JSON を段階的に生成
   ↓
5. サーバー → クライアント（SSE）
   data: { type: "a2ui", surface: {...}, data: {...} }
   ↓
6. クライアント: A2UIRenderer
   JSON → React コンポーネントに変換
   ↓
7. ユーザーがフォーム入力
   data.reservation.date = "2024-01-15"
   ↓
8. ユーザーがボタンクリック
   POST /api/action { action: "submit_reservation", data: {...} }
   ↓
9. サーバーが処理
   新しい A2UI メッセージまたは成功メッセージを返す
```

## A2UI のすごさを実感するポイント

このデモで実感できる A2UI の価値：

### 1. **自然言語から UI 構造を生成**

従来の方法では、開発者が全てのフォームを事前に定義する必要がありました。しかし、このデモでは：

```
ユーザー: 「レストラン予約したい」
  ↓
OpenAI API: ユーザーの意図を理解
  ↓
A2UI JSON: 予約フォームの構造を自動生成
  （日付、時間、人数、名前、メールのフィールド）
  ↓
React UI: 実際のフォームが表示される
```

**開発者は「どんなフィールドが必要か」を考えなくて良い。LLM が適切な構造を生成します。**

**ただし**: ボタンクリック時の処理（予約の送信、バリデーションなど）は開発者が実装する必要があります。

### 2. **どんな要求にも対応（構造レベル）**

- 「タスク管理アプリ」→ タスクフォーム（タイトル、説明、期限など）
- 「イベント申し込み」→ イベントフォーム（名前、メール、参加人数など）
- 「商品検索」→ 検索 UI（検索フィールド、フィルターなど）

**事前定義不要。LLM が動的に UI 構造を生成します。**

**ただし**: 各アクション（検索実行、フィルター適用など）の処理は開発者が実装する必要があります。

### 3. **ストリーミングでリアルタイム生成**

LLM が生成しながら、UI が段階的に構築されます。ユーザーは待たずに UI を見ることができます。

### 4. **セキュアな設計**

LLM は実行可能なコードを生成しません。JSON 形式の宣言的なデータのみを生成し、クライアント側で安全にレンダリングされます。

### 5. **開発者の役割**

A2UI を使う開発者は：

- ✅ **コンポーネントの挙動を実装**（一度実装すれば、LLM が生成した構造で自動的に動作）
- ✅ **アクション処理を実装**（ボタンクリック時の処理）
- ✅ **バリデーションを実装**（必要に応じて）
- ❌ **フォームの構造を定義する必要がない**（LLM が生成）

**つまり**: 開発者は「どう動くか」だけを実装し、「何を表示するか」は LLM に任せられます。

## 次のステップ

- [A2UI 公式サイト](https://a2ui.org/)で詳細な仕様を確認
- より複雑なコンポーネント（チャート、マップなど）を追加
- 他の LLM（Gemini API、Claude など）と統合
- ストリーミングレンダリングの改善
- カスタムコンポーネントの追加

## 参考リンク

- [A2UI 公式サイト](https://a2ui.org/)
- [A2UI GitHub](https://github.com/google/A2UI)
- [Zenn 記事: A2UI を試してみる](https://zenn.dev/soundtricker/articles/a0c46f366ef953)

## ライセンス

MIT
