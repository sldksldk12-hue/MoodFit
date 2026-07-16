/**
 * 파일: src/store/slices/cartSlice.js
 * 분류: 전역 상태 관리 모듈
 *
 * 역할
 * - 장바구니 상품·수량을 Redux 전역 상태로 관리합니다.
 *
 * 사용 기술
 * - Redux Toolkit createSlice, Immer
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
/*
  장바구니 전역 상태 관리

  사용 기술:
  - Redux Toolkit createSlice
  - Immer 기반 불변성 처리
  - action.payload를 통한 데이터 전달

  createSlice를 사용하면
  action type, action 생성 함수, reducer를 한 번에 만들 수 있다.
*/

// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { createSlice } from "@reduxjs/toolkit";

/*
  장바구니 초기 상태

  items 배열 안에는 다음 형태의 상품이 들어간다.

  {
    id: 상품 ID,
    option: 선택 옵션,
    quantity: 수량,
    cartKey: 장바구니 항목 식별값
  }
*/
const initialState = {
  items: [],
};

const cartSlice = createSlice({
  // Redux DevTools와 action type에서 사용하는 이름
  name: "cart",

  // 장바구니의 최초 상태
  initialState,

  /*
    동기 상태 변경 함수 모음

    Redux Toolkit은 내부적으로 Immer를 사용하기 때문에
    state.items.push()처럼 직접 변경하는 문법을 작성해도
    실제로는 안전한 불변성 업데이트로 처리된다.
  */
  reducers: {
    /*
      장바구니 상품 추가

      action.payload에는 추가하려는 상품 객체가 들어온다.
    */
    addToCart: (state, action) => {
      const newItem = action.payload;

      /*
        같은 상품 ID와 같은 옵션을 가진 항목이
        이미 장바구니에 있는지 확인한다.
      */
      const existingItem = state.items.find(
        (item) =>
          item.id === newItem.id &&
          item.option === newItem.option
      );

      if (existingItem) {
        // 동일 상품과 옵션이 이미 있으면 수량만 합친다.
        existingItem.quantity += newItem.quantity;
      } else {
        // 없다면 새 상품을 배열에 추가한다.
        state.items.push(newItem);
      }
    },

    /*
      장바구니 수량 1 증가

      action.payload에는 cartKey가 들어온다.
      cartKey를 사용하는 이유는 같은 상품이라도
      옵션별로 서로 다른 장바구니 항목을 구분하기 위해서다.
    */
    increaseQuantity: (state, action) => {
      const item = state.items.find(
        (item) => item.cartKey === action.payload
      );

      if (item) {
        item.quantity += 1;
      }
    },

    /*
      장바구니 수량 1 감소

      수량이 1보다 클 때만 감소시켜
      0 이하가 되는 것을 방지한다.
    */
    decreaseQuantity: (state, action) => {
      const item = state.items.find(
        (item) => item.cartKey === action.payload
      );

      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
    },

    /*
      장바구니 상품 삭제

      filter로 삭제 대상이 아닌 항목만 남긴 새 배열을 만든다.
    */
    removeFromCart: (state, action) => {
      state.items = state.items.filter(
        (item) => item.cartKey !== action.payload
      );
    },

    /*
      장바구니 전체 비우기

      결제 완료 또는 전체 삭제 버튼에 사용할 수 있다.
    */
    clearCart: (state) => {
      state.items = [];
    },
  },
});

/*
  createSlice가 자동으로 만든 action 생성 함수를 export한다.

  컴포넌트 사용 예:
  dispatch(addToCart(product));
  dispatch(increaseQuantity(cartKey));
*/
export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

// store.js에 연결할 reducer를 export한다.
export default cartSlice.reducer;
