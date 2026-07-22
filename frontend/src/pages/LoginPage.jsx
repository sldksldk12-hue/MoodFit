/**
 * 파일: src/pages/LoginPage.jsx
 * 분류: 라우팅 페이지
 *
 * 역할
 * - 로그인 폼을 처리하고 인증 성공 후 페이지를 이동합니다.
 *
 * 사용 기술
 * - Auth Context, controlled form, useNavigate
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import "../assets/styles/pages/auth/LoginPage.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../store/AuthContext";

/**
 * LoginPage 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  // username: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
  const [username, setUsername] = useState('');
  // password: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
  const [password, setPassword] = useState('');
  // error: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
  const [error, setError] = useState('');
  const { login } = useAuth();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/moodfit";



  // 로그인 성공 시, location.state에 저장된 이전 목적지(from)가 있다면 그곳으로 보내고, 없다면 기본 페이지인 메인으로 이동시킵니다.
  // ProtectedRoute에서 넘겨준 가려고 했던 주소(from)가 있다면 추출하고, 없다면 메인('/')을 기본값으로 설정합니다.

  // handleLogin: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch {
      setError("아이디 혹은 비밀번호가 일치하지 않습니다");
    }
  };
  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <>
      <main className="login-page">
        <section className="login-section">
          <div className="login-left">
            <span className="eyebrow">AI CLOTHING RECOMMENDATION</span>

            <h1>
              AI 기반 맞춤형
              <br />
              패션 추천 서비스
            </h1>

            <p>
              오늘의 날씨와 사용자 취향을 분석하여
              <br />
              나만의 스타일을 추천해드립니다.
            </p>
          </div>

          <div className="login-card">
            <h2>로그인</h2>

            <form className="login-form" onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <input
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit">
                로그인
              </button>
            </form>

            <div className="login-links">
              <Link to="/moodfit/register">회원가입</Link>
              <span>|</span>
              <a href="/find-id">아이디 찾기</a>
              <span>|</span>
              <a href="/find-password">비밀번호 찾기</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default LoginPage;