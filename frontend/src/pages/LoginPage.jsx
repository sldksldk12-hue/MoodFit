
import "../assets/styles/LoginPage.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../store/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";



  // 로그인 성공 시, location.state에 저장된 이전 목적지(from)가 있다면 그곳으로 보내고, 없다면 기본 페이지인 메인으로 이동시킵니다.
  // ProtectedRoute에서 넘겨준 가려고 했던 주소(from)가 있다면 추출하고, 없다면 메인('/')을 기본값으로 설정합니다.

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError("아이디 혹은 비밀번호가 일치하지 않습니다");
    }
  };
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

export default LoginPage;