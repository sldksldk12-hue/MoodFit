/**
 * 파일: src/components/chat/ChatBot.jsx
 * 분류: 채팅 기능 컴포넌트
 *
 * 역할
 * - 우측 하단 플로팅 버튼과 팝업 채팅창의 열림·닫힘 상태를 Redux와 연결합니다.
 *
 * 사용 기술
 * - Redux useSelector/useDispatch, 조건부 렌더링
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { Bot } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import ChatPage from "./ChatPage";
import {
  closePopupChat,
  openPopupChat,
} from "../../store/slices/chatSlice";
import "../../assets/styles/chat/ChatBot.css";

/**
 * ChatBot 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const ChatBot = () => {
  // Redux Store에 상태 변경 명령(action)을 전달하기 위한 dispatch 함수입니다.
  const dispatch = useDispatch();
  // 여러 컴포넌트가 공유하는 Redux 상태에서 현재 화면에 필요한 값만 선택합니다.
  const popupChatOpen = useSelector((state) => state.chat.popupChatOpen);

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <>
      <button
        type="button"
        className="floating-chatbot"
        onClick={() => dispatch(openPopupChat())}
      >
        <Bot size={24} />
        AI 챗봇
      </button>

      {popupChatOpen && (
        <div className="chat-popup">
          <ChatPage
            mode="popup"
            closeChat={() => dispatch(closePopupChat())}
          />
        </div>
      )}
    </>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default ChatBot;
