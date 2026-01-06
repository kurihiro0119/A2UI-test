const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// OpenAI APIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "⚠️  OPENAI_API_KEYが設定されていません。環境変数を設定してください。"
  );
}

app.use(cors());
app.use(express.json());

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

// A2UIメッセージを生成するエージェント（OpenAI API使用）
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  console.log("📨 受信したメッセージ:", message);

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
          console.log("📦 パースしたJSON:", JSON.stringify(parsed, null, 2));
          if (parsed.type === "a2ui") {
            console.log(
              "✅ A2UIメッセージを送信:",
              JSON.stringify(parsed, null, 2)
            );
            res.write(`data: ${JSON.stringify(parsed)}\n\n`);
            jsonBuffer = ""; // 送信済みなのでクリア
          }
        } catch (e) {
          // JSONがまだ不完全な場合、続きを待つ
        }
      }
    }

    // ストリーミング終了後、最終的なJSONを送信
    console.log("📝 OpenAI APIからの完全なレスポンス:", fullResponse);
    try {
      let finalJson = fullResponse.trim();
      finalJson = finalJson
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```\s*$/, "");
      const finalParsed = JSON.parse(finalJson);
      console.log("📦 最終パース結果:", JSON.stringify(finalParsed, null, 2));
      if (finalParsed.type === "a2ui") {
        console.log(
          "✅ 最終A2UIメッセージを送信:",
          JSON.stringify(finalParsed, null, 2)
        );
        res.write(`data: ${JSON.stringify(finalParsed)}\n\n`);
      }
    } catch (e) {
      console.error("❌ JSON parse error:", e);
      console.error("📄 レスポンス全文:", fullResponse);
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

    res.end();
  } catch (error) {
    console.error("OpenAI API error:", error);
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
              text: `エラーが発生しました: ${error.message}`,
              style: { color: "#ea4335" },
            },
          ],
        },
        data: {},
      })}\n\n`
    );
    res.end();
  }
});

// アクションを処理
app.post("/api/action", async (req, res) => {
  const { action, data } = req.body;

  console.log("🎯 アクション受信:", {
    action,
    data: JSON.stringify(data, null, 2),
  });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEYが設定されていません。",
    });
  }

  try {
    // アクションに応じて、LLMに次のUIを生成させる
    const systemPrompt = `あなたはA2UIプロトコルを使ってUIを生成するAIエージェントです。
ユーザーがアクションを実行しました。次の適切なUIを生成してください。

${A2UI_SPEC}`;

    const userPrompt = `アクション: ${action}
データ: ${JSON.stringify(data, null, 2)}

上記のアクションに応じて、次のUIをA2UI形式のJSONで生成してください。
JSONのみを返してください。`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content;
    let jsonString = responseText.trim();
    jsonString = jsonString
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```\s*$/, "");

    const a2uiMessage = JSON.parse(jsonString);
    console.log(
      "📦 アクション用A2UIメッセージ:",
      JSON.stringify(a2uiMessage, null, 2)
    );

    if (a2uiMessage.type === "a2ui") {
      console.log("✅ アクション用A2UIメッセージを返送");
      res.json(a2uiMessage);
    } else {
      // フォールバック: 成功メッセージ
      res.json({
        success: true,
        message: `アクション「${action}」が実行されました`,
        data: data,
      });
    }
  } catch (error) {
    console.error("Action error:", error);

    // フォールバック処理
    if (action === "submit_reservation") {
      res.json({
        success: true,
        message: "予約が完了しました！",
        reservation: data,
      });
    } else if (action === "get_weather") {
      const city = data.weather?.city || "東京";
      res.json({
        success: true,
        message: `${city}の天気情報`,
        weather: {
          city: city,
          temperature: "22°C",
          condition: "晴れ",
          humidity: "65%",
        },
      });
    } else {
      res.json({
        success: false,
        message: `エラー: ${error.message}`,
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 A2UIサーバーが起動しました: http://localhost:${PORT}`);
  console.log(`📝 エンドポイント:`);
  console.log(`   POST /api/chat - チャットメッセージを送信（OpenAI API使用）`);
  console.log(`   POST /api/action - UIアクションを処理`);
  if (process.env.OPENAI_API_KEY) {
    console.log(`✅ OpenAI API KEYが設定されています`);
  } else {
    console.log(`⚠️  OPENAI_API_KEYが設定されていません`);
  }
});
