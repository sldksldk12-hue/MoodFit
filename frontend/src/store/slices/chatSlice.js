/**
 * 파일: src/store/slices/chatSlice.js
 * 분류: 전역 상태 관리 모듈
 *
 * 역할
 * - 채팅 메시지·세션·창 열림 상태와 AI API 비동기 요청을 관리합니다.
 *
 * 사용 기술
 * - Redux Toolkit createSlice/createAsyncThunk
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
/*
  AI 채팅 전역 상태 관리

  사용 기술:
  - Redux Toolkit
  - createSlice: 동기 상태 변경 관리
  - createAsyncThunk: 비동기 API 요청 관리
  - optional chaining(?.)
  - null 병합 연산자(??)
  - Web Crypto API
  - Redux의 getState와 rejectWithValue

  이 Slice를 사용하는 이유:
  메인 채팅창과 팝업 채팅창이
  동일한 메시지, 세션 ID, 로딩 상태를 공유하기 위해서다.
*/

// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import { chatStart } from "../../services/api";

/*
  각 메시지를 구분하기 위한 고유 ID 생성

  브라우저가 crypto.randomUUID를 지원하면
  충돌 가능성이 매우 낮은 UUID를 사용한다.

  지원하지 않는 환경에서는 현재 시간과 난수를 조합한다.
*/
const createMessageId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

/*
  여러 형태로 전달될 수 있는 값을
  화면에 출력 가능한 문자열로 변환한다.

  백엔드 오류는 문자열, 배열, 객체 등
  다양한 형태로 전달될 수 있기 때문에 필요한 방어 함수다.
*/
const toMessageText = (value) => {
  // 이미 문자열이면 그대로 반환
  if (typeof value === "string") {
    return value;
  }

  // 배열 형태의 Pydantic 검증 오류 등을 문자열로 변환
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.msg ?? JSON.stringify(item)
      )
      .join(", ");
  }

  // 일반 객체면 JSON 문자열로 변환
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  // null 또는 undefined면 빈 문자열로 변환
  return String(value ?? "");
};

/*
  채팅 API 요청을 담당하는 비동기 Thunk

  createAsyncThunk는 요청 상태에 따라 자동으로
  pending, fulfilled, rejected action을 만들어준다.
*/
export const sendChatMessage = createAsyncThunk(
  // Redux action type의 접두사
  "chat/sendChatMessage",

  /*
    첫 번째 인자:
    컴포넌트에서 dispatch할 때 전달한 데이터

    두 번째 인자:
    Redux Toolkit이 제공하는 Thunk API
    - getState: 현재 Redux 전체 상태 조회
    - rejectWithValue: 사용자 정의 실패 값을 rejected에 전달
  */
  async (
    { message, userId = 1 },
    { getState, rejectWithValue }
  ) => {
    try {
      /*
        현재 채팅 세션 ID를 Redux Store에서 가져온다.

        기존 세션 ID를 서버에 보내야
        AI가 이전 대화를 이어갈 수 있다.
      */
      const sessionId =
        getState().chat.sessionId;

      // FastAPI의 /api/chat/emotion 호출
      const data = await chatStart({
        userId,
        message,
        sessionId,
      });

      /*
        HTTP 요청은 성공했어도
        백엔드가 { error: ... }를 반환할 수 있으므로 확인한다.
      */
      if (data?.error) {
        return rejectWithValue(
          toMessageText(data.error)
        );
      }

      // 성공 결과는 fulfilled action의 payload가 된다.
      return data;
    } catch (error) {
      /*
        Axios 오류 구조별로 메시지를 찾아온다.

        우선순위:
        1. FastAPI detail
        2. 백엔드 error
        3. JavaScript error.message
        4. 기본 오류 문구
      */
      const errorValue =
        error.response?.data?.detail ??
        error.response?.data?.error ??
        error.message ??
        "AI 응답을 불러오지 못했습니다.";

      return rejectWithValue(
        toMessageText(errorValue)
      );
    }
  }
);

/*
  채팅 Slice 초기 상태
*/
const initialState = {
  // HeroContent 입력창에 입력한 문장
  heroInput: "",

  // 사용자와 AI의 전체 대화 목록
  messages: [],

  // FastAPI가 발급한 대화 세션 ID
  sessionId: null,

  // AI 응답을 기다리는 중인지 여부
  loading: false,

  // 메인 화면 채팅창 열림 여부
  mainChatOpen: false,

  // 우측 하단 팝업 채팅창 열림 여부
  popupChatOpen: false,

  // 마지막 오류 메시지
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,

  /*
    일반 동기 action을 처리하는 reducers
  */
  reducers: {
    // Hero 입력창 내용을 Redux에 저장
    setHeroInput: (state, action) => {
      state.heroInput = action.payload;
    },

    /*
      메인 채팅창 열기

      메인 채팅을 열 때 팝업은 닫아서
      채팅창 두 개가 동시에 보이지 않게 한다.
    */
    openMainChat: (state) => {
      state.mainChatOpen = true;
      state.popupChatOpen = false;
    },

    // 메인 채팅창 닫기
    closeMainChat: (state) => {
      state.mainChatOpen = false;
    },

    // 팝업 채팅창 열기
    openPopupChat: (state) => {
      state.popupChatOpen = true;
    },

    // 팝업 채팅창 닫기
    closePopupChat: (state) => {
      state.popupChatOpen = false;
    },

    /*
      사용자가 보낸 메시지를 먼저 화면에 추가

      API 응답을 기다리기 전에 메시지가 바로 표시되어
      사용자 경험이 더 자연스러워진다.
    */
    addUserMessage: (state, action) => {
      state.messages.push({
        id: createMessageId(),
        sender: "user",
        text: action.payload,
      });
    },

    // Hero 입력창 초기화
    clearHeroInput: (state) => {
      state.heroInput = "";
    },

    /*
      전체 채팅 초기화

      새 객체를 직접 작성하는 대신 initialState를 반환해
      모든 값을 한 번에 초기 상태로 되돌린다.
    */
    resetChat: () => initialState,
  },

  /*
    createAsyncThunk가 만든 비동기 action 처리

    reducers는 같은 Slice의 일반 action을 처리하고,
    extraReducers는 외부 action이나 비동기 Thunk action을 처리한다.
  */
  extraReducers: (builder) => {
    builder
      /*
        API 요청 시작
      */
      .addCase(
        sendChatMessage.pending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )

      /*
        API 요청 성공
      */
      .addCase(
        sendChatMessage.fulfilled,
        (state, action) => {
          state.loading = false;

          /*
            서버가 새로운 session_id를 반환하면 저장한다.

            0 같은 값도 유효할 수 있으므로
            단순 if(action.payload.session_id)가 아니라
            null과 undefined를 정확히 검사한다.
          */
          if (
            action.payload?.session_id !== null &&
            action.payload?.session_id !== undefined
          ) {
            state.sessionId =
              action.payload.session_id;
          }

          // AI 응답 메시지를 대화 목록에 추가
          state.messages.push({
            id: createMessageId(),
            sender: "ai",
            text: toMessageText(
              action.payload?.ai_response ??
              "AI 응답 내용이 없습니다."
            ),

            // 감정 분석 결과가 있으면 함께 저장
            emotion:
              action.payload?.mapped_emotion,
            // 네이버 쇼핑 검색에 사용된 키워드
            searchKeyword:
              action.payload?.search_keyword ?? "",
            summaryReason:
              action.payload?.summary_reason ?? "",

            // 네이버 쇼핑 API에서 받은 상품 목록
            // 배열이 아닌 값이 들어오면 빈 배열로 처리한다.
            products: Array.isArray(
              action.payload?.products
            )
              ? action.payload.products
              : [],

          });
        }
      )

      /*
        API 요청 실패
      */
      .addCase(
        sendChatMessage.rejected,
        (state, action) => {
          state.loading = false;

          /*
            rejectWithValue로 전달한 값은 action.payload에 들어온다.
            payload가 없다면 기본 오류 문구를 사용한다.
          */
          state.error =
            action.payload ??
            "AI 요청에 실패했습니다.";

          /*
            오류도 AI 메시지 형태로 배열에 넣는다.
    
            화면에서는 isError 값을 이용해
            일반 AI 메시지와 다른 디자인을 적용할 수 있다.
          */
          state.messages.push({
            id: createMessageId(),
            sender: "ai",
            text: toMessageText(state.error),
            isError: true,
          });
        }
      );
  },
});

/*
  컴포넌트에서 dispatch할 동기 action 함수
*/
export const {
  setHeroInput,
  openMainChat,
  closeMainChat,
  openPopupChat,
  closePopupChat,
  addUserMessage,
  clearHeroInput,
  resetChat,
} = chatSlice.actions;

// Store에 등록할 reducer
export default chatSlice.reducer;
