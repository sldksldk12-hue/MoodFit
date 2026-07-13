import { useState } from 'react';
import '../assets/styles/ChatPage.css';
import { Link } from 'react-router-dom';


const ChatPage = ({ mode = "full", closeChat, firstMessage }) => {
    const [messages, setMessages] = useState([{
        role: "user",
        content: firstMessage,
    },
    {
        role: "ai",
        content: "AI 응답 예시입니다.",
    }]);
    const [input, setInput] = useState("");

    const sendMessage = () => {
        if (input.trim() === "") return;

        const userMessage = {
            role: "user",
            content: input,
        };

        const aiMessage = {
            role: "ai",
            content: (
                <>
                    AI 응답 예시입니다.
                    <br />
                    <Link to="/moodfit/ailist">상품 리스트</Link>를 확인해보세요.
                </>
            ),
        };
        setMessages((prev) => [...prev, userMessage, aiMessage]);
        setInput("");
    };
    return (
        <div className={`chat-container ${mode}`}>
            <div className="chat-log">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={msg.role === "user" ? "user-message" : "ai-message"}
                    >
                        {msg.content}
                    </div>
                ))}
            </div>

            <div className="chat-input-area">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                />
                <button type="button" onClick={sendMessage}>전송</button>

                <button
                    type="button"
                    className="chat-back-button"
                    onClick={closeChat}
                >
                    닫기
                </button>
            </div>

        </div>
    );
};

export default ChatPage;