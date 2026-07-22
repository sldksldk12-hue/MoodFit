/**
 * 파일: src/store/AuthContext.jsx
 * 분류: 전역 상태 관리 모듈
 *
 * 역할
 * - JWT 기반 로그인 사용자 상태를 앱 전체에 공유합니다.
 *
 * 사용 기술
 * - React Context API, localStorage, useEffect
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
/*
  사용 기술
  1. React Context API
     - 로그인 정보를 여러 컴포넌트에서 공유하기 위해 사용한다.
  2. React Hooks
     - useState: 사용자와 로딩 상태 관리
     - useEffect: 앱 최초 실행 시 로그인 확인
     - useContext: 하위 컴포넌트에서 인증 정보 사용
  3. localStorage
     - 새로고침 이후에도 JWT 토큰을 유지한다.
*/

// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getMe,
  login as loginApi,
} from "../services/api";

/*
  인증 정보를 담을 Context 생성

  초기값 null은 AuthProvider 밖에서 잘못 사용했을 때
  인증 정보가 존재하지 않음을 명확하게 보여준다.
*/
const AuthContext = createContext(null);

/*
  AuthProvider

  children은 AuthProvider 내부에 들어오는 모든 컴포넌트를 의미한다.
  Provider 아래 컴포넌트들은 user, login, logout 등을 공유할 수 있다.
*/
export const AuthProvider = ({ children }) => {
  // 현재 로그인한 사용자 정보
  // 로그인하지 않은 경우 null
  const [user, setUser] = useState(null);

  // 로그인 확인이 끝났는지 나타내는 상태
  // 초기값 true인 이유는 앱 시작 직후 토큰 검사를 진행하기 때문이다.
  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem("token"))
  );

  /*
    저장된 토큰으로 로그인 상태 확인

    흐름:
    localStorage 토큰 확인
    → 토큰이 있으면 /moodfit/me 요청
    → 성공하면 사용자 정보 저장
    → 실패하면 만료되거나 잘못된 토큰 삭제
  */
  const checkLogin = async () => {
    const token = localStorage.getItem("token");

    // 토큰이 없다면 로그인하지 않은 상태
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // 백엔드에 현재 로그인 사용자 정보 요청
      // api.js의 getMe에서 Authorization 헤더에 토큰을 넣는다.
      const response = await getMe();

      // 서버가 반환한 사용자 정보를 상태에 저장
      setUser(response.data);
    } catch {
      // 토큰이 만료됐거나 인증에 실패한 경우
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      // 성공과 실패 여부와 관계없이 로그인 확인 종료
      setLoading(false);
    }
  };

  /*
    컴포넌트가 처음 마운트될 때 한 번 실행

    빈 배열 []을 넣었기 때문에 최초 렌더링 이후 한 번만 실행된다.
    새로고침을 해도 localStorage 토큰으로 로그인 상태를 복구한다.
  */
  // 앱이 처음 실행될 때 저장된 토큰이 있는 경우에만 로그인 정보를 복구합니다.
  // 상태 변경은 Promise 콜백에서 처리하여 effect 본문에서 동기적으로 setState를 호출하지 않습니다.
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return undefined;

    let isCancelled = false;

    getMe()
      .then((response) => {
        if (!isCancelled) {
          setUser(response.data);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");

        if (!isCancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  /*
    로그인 처리

    1. 아이디와 비밀번호를 백엔드로 전송
    2. 전달받은 access_token을 localStorage에 저장
    3. checkLogin을 호출해 실제 사용자 정보를 가져옴
  */
  const login = async (username, password) => {
    const response = await loginApi(username, password);

    localStorage.setItem(
      "token",
      response.data.access_token
    );

    // 토큰 저장 후 사용자 정보를 다시 조회
    await checkLogin();

    // 로그인 페이지에서 필요한 경우 응답을 사용할 수 있도록 반환
    return response.data;
  };

  /*
    로그아웃 처리

    저장된 토큰과 사용자 상태를 모두 제거한다.
  */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <AuthContext.Provider
      value={{
        // 로그인한 사용자 객체
        user,

        // 로그인 확인 중인지 여부
        loading,

        // user가 존재하면 true, 없으면 false
        // !!는 값을 불리언으로 변환하는 JavaScript 문법이다.
        isLogin: !!user,

        // 로그인 함수
        login,

        // 로그아웃 함수
        logout,

        // 필요한 경우 수동으로 로그인 상태를 다시 확인할 수 있는 함수
        checkLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/*
  인증 Context를 쉽게 사용하기 위한 커스텀 훅

  다른 컴포넌트에서는 다음과 같이 사용한다.

  const { user, isLogin, login, logout } = useAuth();
*/
export const useAuth = () => {
  return useContext(AuthContext);
};
