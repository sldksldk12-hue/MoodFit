/**
 * 파일: src/components/chat/ChatPage.jsx
 * 분류: 채팅 기능 컴포넌트
 *
 * 역할
 * - 사용자 메시지 전송, AI 응답 표시, 세션 유지, 자동 스크롤을 담당하는 공용 채팅 UI입니다.
 *
 * 사용 기술
 * - Redux Toolkit 비동기 Thunk, useEffect, useRef, controlled textarea
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../store/AuthContext";

import {
  addUserMessage,
  clearHeroInput,
  sendChatMessage,
} from "../../store/slices/chatSlice";
import "../../assets/styles/chat/ChatPage.css";
import "../../assets/styles/product/ProductListPage.css";
import { useNavigate } from "react-router-dom";
import { setRecommendationGroup } from "../../store/slices/recommendationSlice";

const toMessageText = (value) => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => item?.msg ?? String(item)).join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
};

/**
 * ChatPage 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const ChatPage = ({ mode = "full", closeChat }) => {
  // Redux Store에 상태 변경 명령(action)을 전달하기 위한 dispatch 함수입니다.
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  // 여러 컴포넌트가 공유하는 Redux 상태에서 현재 화면에 필요한 값만 선택합니다.
  const { messages, loading, heroInput } = useSelector((state) => state.chat);
  // message: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
  const [message, setMessage] = useState("");
  // 렌더링을 발생시키지 않고 DOM 또는 이전 실행 여부를 기억하기 위해 useRef를 사용합니다.
  const firstMessageSentRef = useRef(false);
  // 렌더링을 발생시키지 않고 DOM 또는 이전 실행 여부를 기억하기 위해 useRef를 사용합니다.
  const chatBottomRef = useRef(null);

  // sendMessage: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
  const sendMessage = (messageToSend = message) => {
    const trimmedMessage = String(messageToSend ?? "").trim();
    if (!trimmedMessage || loading) return;

    const currentUserId = user?.id ? Number(user.id) : 1;

    dispatch(addUserMessage(trimmedMessage));
    dispatch(sendChatMessage({ message: trimmedMessage, userId: currentUserId }));
    setMessage("");
  };

  // 컴포넌트 렌더링 이후 API 호출, DOM 동기화 또는 이벤트 정리가 필요할 때 실행합니다.
  useEffect(() => {
    const firstMessage = String(heroInput ?? "").trim();
    if (!firstMessage || firstMessageSentRef.current || messages.length > 0) return;

    firstMessageSentRef.current = true;
    sendMessage(firstMessage);
    dispatch(clearHeroInput());
    // 최초 입력 자동 전송만 담당하므로 의존성은 heroInput만 둔다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroInput]);

  // 컴포넌트 렌더링 이후 API 호출, DOM 동기화 또는 이벤트 정리가 필요할 때 실행합니다.
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // handleKeyDown: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };
  const handleOpenRecommendation = (msg) => {
    const products = Array.isArray(msg.products)
      ? msg.products
      : [];

    if (products.length === 0) {
      return;
    }

    const searchKeyword =
      toMessageText(msg.searchKeyword) ||
      "맞춤 코디";

    const recommendationTitle =
      `${searchKeyword} 추천 상품`;

    dispatch(
      setRecommendationGroup({
        title: recommendationTitle,

        // AI 답변 전체를 해당 상품들의 공통 추천 이유로 사용
        reason: toMessageText(msg.text),

        searchKeyword,

        products,
      })
    );

    navigate("/moodfit/ailist");

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  };

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <div className={`chat-container ${mode}`}>
      <div className="chat-header">
        <div>
          <strong>MOODFIT AI</strong>
          <span>감정과 날씨에 맞는 코디 추천</span>
        </div>

        {closeChat && (
          <button
            type="button"
            className="chat-header-close"
            onClick={closeChat}
            aria-label="채팅창 닫기"
          >
            ×
          </button>
        )}
      </div>

      <div className="chat-log">
        {messages.length === 0 && !loading && (
          <div className="chat-empty-message">
            <div className="ai-message">
              안녕하세요! 오늘 기분이나 필요한 스타일을 알려주세요.
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
          return (
            <div
              key={msg.id}
              className={`chat-message-row ${isUser ? "chat-message-row--user" : "chat-message-row--ai"
                }`}
            >
              <div
                className={
                  isUser
                    ? "user-message"
                    : `ai-message ${msg.isError ? "ai-message--error" : ""}`
                }
              >
                {/* 사용자 또는 AI의 일반 메시지 */}
                <p>{toMessageText(msg.text)}</p>

                {/* 감정 분석 결과 */}
                {msg.emotion && (
                  <small className="emotion-result">
                    분석 감정: {toMessageText(msg.emotion)}
                  </small>
                )}

                {/* AI가 네이버 쇼핑에 사용한 검색 키워드 */}
                {!isUser && msg.searchKeyword && (
                  <p className="shopping-keyword">
                    추천 상품 검색어:{" "}
                    <strong>
                      {toMessageText(msg.searchKeyword)}
                    </strong>
                  </p>
                )}
                {/* AI 추천 상품 그룹 */}
                {!isUser &&
                  Array.isArray(msg.products) &&
                  msg.products.length > 0 && (
                    <div className="chat-recommendation-group">
                      <div className="chat-recommendation-content">
                        <span className="chat-recommendation-label">
                          MOODFIT AI 추천
                        </span>

                        <h3 className="chat-recommendation-title">
                          {toMessageText(msg.searchKeyword) ||
                            "맞춤 코디 추천"}
                        </h3>

                        <p className="chat-recommendation-reason">
                          지금 말씀해주신 기분과 날씨, 취향을
                          바탕으로 어울리는 상품을 모았어요.
                        </p>

                        <div className="chat-recommendation-summary">
                          <span>
                            추천 상품 {msg.products.length}개
                          </span>

                          {msg.searchKeyword && (
                            <span>
                              검색 기준:{" "}
                              {toMessageText(msg.searchKeyword)}
                            </span>
                          )}
                        </div>

                        {/* 상품 이미지를 일부만 미리보기 */}
                        <div className="chat-recommendation-preview">
                          {msg.products
                            .slice(0, 4)
                            .map((product, index) => (
                              <div
                                className="chat-recommendation-preview-item"
                                key={
                                  product.id ??
                                  product.link ??
                                  `${product.title}-${index}`
                                }
                              >
                                {(product.image ||
                                  product.image_url) && (
                                    <img
                                      src={
                                        product.image ??
                                        product.image_url
                                      }
                                      alt={
                                        product.title ??
                                        product.product_name ??
                                        "추천 상품"
                                      }
                                      loading="lazy"
                                    />
                                  )}
                              </div>
                            ))}
                        </div>

                        <button
                          type="button"
                          className="chat-recommendation-button"
                          onClick={() =>
                            handleOpenRecommendation(msg)
                          }
                        >
                          추천 리스트 보기
                        </button>
                      </div>
                    </div>
                  )}


                {/* 검색은 했지만 상품 결과가 없을 때 */}
                {!isUser &&
                  msg.searchKeyword &&
                  Array.isArray(msg.products) &&
                  msg.products.length === 0 && (
                    <p className="chat-product-empty">
                      해당 검색어로 추천 상품을 찾지 못했습니다.
                    </p>
                  )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="chat-message-row chat-message-row--ai">
            <div className="ai-message ai-message--loading">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="기분이나 원하는 코디를 입력하세요..."
          rows={1}
          disabled={loading}
        />

        <button
          type="button"
          className="chat-send-button"
          onClick={() => sendMessage()}
          disabled={loading || !message.trim()}
        >
          {loading ? "응답 중..." : "전송"}
        </button>
      </div>
    </div>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default ChatPage;
