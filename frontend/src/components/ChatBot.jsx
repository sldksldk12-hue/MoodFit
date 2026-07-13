import React, { useState } from "react";
import { Bot } from "lucide-react";
import ChatPage from "./ChatPage";
import "../assets/styles/ChatBot.css";

const ChatBot = ({ chatMessage }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className="floating-chatbot"
                onClick={() => setIsChatOpen(true)}
            >
                <Bot size={24} />
                AI 챗봇
            </button>

            {isChatOpen && (
                <div className="chat-popup">
                    <ChatPage
                        mode="popup"
                        firstMessage={chatMessage}
                        closeChat={() => setIsChatOpen(false)}
                    />
                </div>
            )}
        </>
    );
};

export default ChatBot;