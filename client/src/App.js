import React, { useState } from 'react';
import './App.css';
import A2UIRenderer from './components/A2UIRenderer';
import ChatInput from './components/ChatInput';

function App() {
  const [uiState, setUiState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (message) => {
    setLoading(true);
    setMessages(prev => [...prev, { type: 'user', text: message }]);
    console.log('📤 クライアント: メッセージ送信:', message);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      console.log('📥 クライアント: レスポンス受信:', response.status, response.statusText);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        console.log('📦 クライアント: チャンク受信:', chunk);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('✅ クライアント: A2UIメッセージ受信:', JSON.stringify(data, null, 2));
              if (data.type === 'a2ui') {
                setUiState(data);
                setMessages(prev => [...prev, { type: 'agent', text: 'UIを生成しました' }]);
              }
            } catch (e) {
              console.error('❌ クライアント: JSON parse error:', e, 'Line:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ クライアント: Error:', error);
      setMessages(prev => [...prev, { type: 'error', text: 'エラーが発生しました' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, data) => {
    console.log('🎯 クライアント: アクション送信:', { action, data: JSON.stringify(data, null, 2) });
    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data }),
      });

      const result = await response.json();
      console.log('📥 クライアント: アクション結果:', JSON.stringify(result, null, 2));
      
      if (result.type === 'a2ui') {
        // 新しいUIを表示
        console.log('✅ クライアント: 新しいA2UIメッセージを受信');
        setUiState(result);
      } else if (result.success) {
        // 成功メッセージを表示
        setMessages(prev => [...prev, { type: 'agent', text: result.message }]);
        alert(result.message);
      }
    } catch (error) {
      console.error('❌ クライアント: Action error:', error);
      alert('アクションの処理中にエラーが発生しました');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>A2UI チュートリアル</h1>
        <p>AIエージェントがUIを生成するデモアプリ</p>
      </header>

      <div className="App-container">
        <div className="chat-section">
          <div className="messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="message loading">生成中...</div>}
          </div>
          <ChatInput onSend={handleSendMessage} disabled={loading} />
        </div>

        <div className="ui-section">
          <h2>生成されたUI</h2>
          {uiState ? (
            <A2UIRenderer 
              surface={uiState.surface} 
              data={uiState.data}
              onAction={handleAction}
            />
          ) : (
            <div className="empty-state">
              <p>メッセージを送信してUIを生成してください</p>
              <p className="hint">例: 「レストラン予約」「天気情報」</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

