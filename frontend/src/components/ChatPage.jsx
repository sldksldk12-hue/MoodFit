import { useEffect, useRef, useState } from "react";
import { chatStart } from "../services/api";

import "../assets/styles/ChatPage.css";

/*
  메시지에 사용할 고유 ID 생성 함수

  최신 브라우저에서는 crypto.randomUUID()를 사용하고,
  지원하지 않는 환경에서는 현재 시간과 난수를 조합한다.
*/
const createMessageId = () => {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

/*
  API에서 받은 값을 화면에 출력할 수 있는 문자열로 변환한다.

  FastAPI의 422 오류 detail은 배열이나 객체 형태로 올 수 있다.
  React에서는 객체를 직접 출력할 수 없기 때문에 반드시 문자열로 바꿔야 한다.
*/
const toMessageText = (value) => {
  // 이미 문자열이면 그대로 반환
  if (typeof value === "string") {
    return value;
  }

  // FastAPI 유효성 검사 오류처럼 배열로 들어오는 경우
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        // Pydantic 오류 객체의 msg 값을 우선 사용
        return item?.msg ?? JSON.stringify(item);
      })
      .join(", ");
  }

  // 일반 객체인 경우 JSON 문자열로 변환
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  // null, undefined, 숫자 등의 값 처리
  return String(value ?? "");
};

/*
  Axios 또는 일반 Error 객체에서 사용자에게 보여줄
  오류 메시지를 추출한다.
*/
const getErrorMessage = (error) => {
  const errorData =
    error.response?.data?.detail ??
    error.response?.data?.error ??
    error.message ??
    "AI 응답을 불러오지 못했습니다.";

  return toMessageText(errorData);
};

const ChatPage = ({
  // full, sticky, popup 등에 따른 CSS 적용값
  mode = "full",

  // 팝업 채팅창을 닫을 때 사용하는 부모 함수
  closeChat,

  // 메인페이지에서 미리 입력한 첫 메시지
  firstMessage = "",
}) => {
  /*
    textarea에 현재 입력된 메시지
  */
  const [message, setMessage] = useState("");

  /*
    백엔드가 처음 대화할 때 생성한 채팅 세션 ID

    첫 요청은 null이고,
    백엔드 응답의 session_id를 받은 다음 요청부터 다시 전송한다.
  */
  const [sessionId, setSessionId] = useState(null);

  /*
    화면에 출력할 사용자·AI 메시지 목록
  */
  const [messages, setMessages] = useState([]);

  /*
    API 요청 중인지 나타내는 상태

    중복 전송을 막고 로딩 애니메이션을 표시하는 데 사용한다.
  */
  const [loading, setLoading] = useState(false);

  /*
    React 개발 모드에서 useEffect가 두 번 실행되거나
    컴포넌트가 다시 렌더링될 때 firstMessage가 중복 전송되는 것을 막는다.
  */
  const firstMessageSentRef = useRef(false);

  /*
    메시지가 추가될 때 채팅창의 마지막 위치로 이동하기 위한 DOM 참조
  */
  const chatBottomRef = useRef(null);

  /*
    사용자 메시지를 백엔드로 전송하는 함수

    messageToSend가 전달되면 해당 값을 사용하고,
    전달되지 않으면 입력창의 message 상태를 사용한다.
  */
  const sendMessage = async (
    messageToSend = message
  ) => {
    /*
      firstMessage가 문자열이 아닌 값으로 들어오는 경우까지
      안전하게 처리한다.
    */
    const trimmedMessage = String(
      messageToSend ?? ""
    ).trim();

    /*
      빈 메시지 또는 이미 요청 중인 상태에서는 전송하지 않는다.
    */
    if (!trimmedMessage || loading) {
      return;
    }

    /*
      백엔드 응답을 기다리기 전에 사용자 메시지를
      채팅 화면에 먼저 출력한다.
    */
    const userMessage = {
      id: createMessageId(),
      sender: "user",
      text: trimmedMessage,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    // 전송 후 입력창 초기화
    setMessage("");

    // 중복 전송 방지 및 로딩 UI 표시
    setLoading(true);

    try {
      /*
        services/api.js의 chatStart를 호출한다.

        프론트의 camelCase 값을 api.js에서
        백엔드가 요구하는 snake_case로 변환한다.
      */
      const data = await chatStart({
        userId: 1,
        message: trimmedMessage,
        sessionId,
      });

      /*
        백엔드가 HTTP 200 상태로
        { error: "..." }를 반환하는 경우를 처리한다.
      */
      if (data?.error) {
        throw new Error(
          toMessageText(data.error)
        );
      }

      /*
        첫 요청에서 생성된 session_id를 저장한다.

        다음 메시지를 보낼 때 같은 session_id를 전송해서
        하나의 채팅 세션으로 대화를 이어간다.
      */
      if (
        data?.session_id !== null &&
        data?.session_id !== undefined
      ) {
        setSessionId(data.session_id);
      }

      /*
        백엔드 AI 응답을 채팅 메시지 객체로 변환한다.
      */
      const aiMessage = {
        id: createMessageId(),
        sender: "ai",
        text: toMessageText(
          data?.ai_response ??
          "AI 응답 내용이 없습니다."
        ),

        /*
          감정 분석 결과를 메시지 아래에 표시하기 위한 값
        */
        emotion: data?.mapped_emotion,
        searchKeyword:
          data?.search_keyword ?? "",

        // 네이버 쇼핑 API에서 받은 상품 목록
        // 배열이 아닌 값이 들어오면 빈 배열로 처리
        products: Array.isArray(data?.products)
          ? data.products
          : [],
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);
    } catch (error) {
      /*
        Axios 요청 실패, FastAPI 422 오류,
        네트워크 오류 등을 확인하기 위한 로그
      */
      console.error(
        "AI 요청 실패:",
        error.response?.data ?? error
      );

      /*
        오류도 AI 메시지 형태로 만들어
        채팅창 안에서 사용자에게 보여준다.
      */
      const errorMessage = {
        id: createMessageId(),
        sender: "ai",
        text: getErrorMessage(error),
        isError: true,
      };

      setMessages((prev) => [
        ...prev,
        errorMessage,
      ]);
    } finally {
      /*
        성공 또는 실패 여부와 관계없이
        API 요청 상태를 종료한다.
      */
      setLoading(false);
    }
  };

  /*
    메인페이지에서 전달된 firstMessage를
    채팅창이 열릴 때 한 번만 자동으로 전송한다.
  */
  useEffect(() => {
    const trimmedFirstMessage = String(
      firstMessage ?? ""
    ).trim();

    /*
      메시지가 없거나 이미 전송했다면 종료
    */
    if (
      !trimmedFirstMessage ||
      firstMessageSentRef.current
    ) {
      return;
    }

    firstMessageSentRef.current = true;
    sendMessage(trimmedFirstMessage);

    /*
      firstMessage가 변경될 때만 실행한다.

      sendMessage를 의존성에 넣으면 렌더링마다 함수가 새로 생성되어
      자동 전송이 반복될 수 있으므로 현재 구조에서는 제외한다.
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstMessage]);

  /*
    새 메시지가 추가되거나 로딩 표시가 나타나면
    채팅창을 가장 아래로 스크롤한다.
  */
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  /*
    Enter: 메시지 전송
    Shift + Enter: 줄바꿈
  */
  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`chat-container ${mode}`}>
      {/* 채팅창 상단 제목 영역 */}
      <div className="chat-header">
        <div>
          <strong>MOODFIT AI</strong>

          <span>
            감정과 날씨에 맞는 코디 추천
          </span>
        </div>

        {/*
          closeChat이 전달된 경우에만 닫기 버튼을 표시한다.
          popup 모드에서는 필요하지만 full 모드에서는 없을 수 있다.
        */}
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

      {/* 사용자와 AI의 메시지를 출력하는 영역 */}
      <div className="chat-log">
        {/*
          아직 전송된 메시지가 없을 때 보여주는 기본 안내 문구
        */}
        {messages.length === 0 &&
          !loading && (
            <div className="chat-empty-message">
              <div className="ai-message">
                안녕하세요! 오늘 기분이나 필요한
                스타일을 알려주세요.
              </div>
            </div>
          )}

        {/*
          messages 배열을 순회하면서
          사용자와 AI 메시지를 서로 다른 방향으로 출력한다.
        */}
        {messages.map((msg) => {
          const isUser =
            msg.sender === "user";

          return (
            <div
              key={msg.id}
              className={`chat-message-row ${isUser
                ? "chat-message-row--user"
                : "chat-message-row--ai"
                }`}
            >
              <div
                className={
                  isUser
                    ? "user-message"
                    : `ai-message ${msg.isError
                      ? "ai-message--error"
                      : ""
                    }`
                }
              >
                {/*
                  API 값이 배열이나 객체여도
                  React 렌더링 오류가 발생하지 않도록
                  문자열로 변환해 출력한다.
                */}
                <p>
                  {toMessageText(msg.text)}
                </p>
                {/* 네이버 쇼핑 검색 키워드 */}
                {!isUser && msg.searchKeyword && (
                  <p className="shopping-keyword">
                    추천 상품 검색어:{" "}
                    <strong>
                      {msg.searchKeyword}
                    </strong>
                  </p>
                )}

                {/* 네이버 쇼핑 추천 상품 목록 */}
                {!isUser &&
                  Array.isArray(msg.products) &&
                  msg.products.length > 0 && (
                    <div className="chat-product-list">
                      {msg.products.map(
                        (product, index) => (
                          <a
                            key={`${product.link}-${index}`}
                            className="chat-product-card"
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={product.image}
                              alt={product.title}
                              className="chat-product-image"
                              loading="lazy"
                            />

                            <div className="chat-product-info">
                              <strong className="chat-product-title">
                                {product.title}
                              </strong>

                              <span className="chat-product-price">
                                {Number(
                                  product.lprice
                                ).toLocaleString()}
                                원
                              </span>

                              <span className="chat-product-link">
                                네이버 쇼핑에서 보기
                              </span>
                            </div>
                          </a>
                        )
                      )}
                    </div>
                  )}

                {/*
                  AI 응답에 감정 분석 결과가 있을 때만 표시한다.
                */}
                {msg.emotion && (
                  <small className="emotion-result">
                    분석 감정:{" "}
                    {toMessageText(
                      msg.emotion
                    )}
                  </small>
                )}
              </div>
            </div>
          );
        })}

        {/*
          AI 답변을 기다리는 동안 점 3개 애니메이션을 표시한다.
        */}
        {loading && (
          <div className="chat-message-row chat-message-row--ai">
            <div className="ai-message ai-message--loading">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </div>
          </div>
        )}

        {/*
          자동 스크롤의 기준점이 되는 빈 요소
        */}
        <div ref={chatBottomRef} />
      </div>

      {/* 사용자 메시지 입력 및 전송 영역 */}
      <div className="chat-input-area">
        <textarea
          /*
            입력창 값을 React state와 연결한다.
          */
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }

          /*
            Enter 전송 처리를 연결한다.
          */
          onKeyDown={handleKeyDown}
          placeholder="기분이나 원하는 코디를 입력하세요..."
          rows={1}

          /*
            API 요청 중에는 입력을 잠가
            같은 메시지가 중복으로 전송되는 것을 막는다.
          */
          disabled={loading}
        />

        <button
          type="button"
          className="chat-send-button"

          /*
            버튼 클릭 시 현재 입력값을 전송한다.
          */
          onClick={() => sendMessage()}

          /*
            요청 중이거나 입력값이 비어 있으면
            전송 버튼을 비활성화한다.
          */
          disabled={
            loading || !message.trim()
          }
        >
          {loading ? "응답 중..." : "전송"}
        </button>
      </div>
    </div>
  );
};

export default ChatPage;