/**
 * 파일: src/store/store.js
 * 분류: 전역 상태 관리 모듈
 *
 * 역할
 * - 각 Slice reducer를 결합해 Redux Store를 생성합니다.
 *
 * 사용 기술
 * - Redux Toolkit configureStore
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// Redux Toolkit에서 전역 저장소(Store)를 생성하는 함수
// configureStore는 reducer 연결, Redux DevTools 연동,
// 기본 미들웨어 설정 등을 자동으로 처리해준다.
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { configureStore } from "@reduxjs/toolkit";

// 각 기능별 Slice에서 만든 reducer를 가져온다.
// reducer는 해당 상태를 어떤 방식으로 변경할지 담당한다.
import chatReducer from "./slices/chatSlice";
import cartReducer from "./slices/cartSlice";
import recommendationReducer from "./slices/recommendationSlice";

/*
  Redux Store 생성

  Store는 프로젝트 전체에서 공통으로 사용할 상태를 보관하는 중앙 저장소다.

  최종 상태 구조:
  {
    chat: { ...채팅 상태 },
    cart: { ...장바구니 상태 },
    recommendation: { ...추천 상태 }
  }
*/
const store = configureStore({
  reducer: {
    // state.chat으로 접근
    chat: chatReducer,

    // state.cart로 접근
    cart: cartReducer,

    // state.recommendation으로 접근
    recommendation: recommendationReducer,
  },
});

// main.jsx의 <Provider store={store}>에 전달하기 위해 내보낸다.
export default store;
