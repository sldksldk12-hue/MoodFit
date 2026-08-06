/**
 * 파일: src/pages/RegisterPage.jsx
 * 분류: 라우팅 페이지
 *
 * 역할
 * - 회원가입 폼 상태와 백엔드 등록 요청을 처리합니다.
 *
 * 사용 기술
 * - controlled form, Axios, useNavigate
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { useState } from "react";
import { UserPlus, Eye, EyeOff, CheckCircle } from "lucide-react";
import "../assets/styles/pages/auth/RegisterPage.css";
import { register, checkUsername } from "../services/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

/**
 * RegisterPage 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const RegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    // user: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
    const [user, setUser] = useState({
        user_name: "",
        password: "",
        passwordCheck: "",
        email: "",
    });

    // showPassword: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
    const [showPassword, setShowPassword] = useState(false);

    const handleCheckUsername = async () => {
        if (!user.user_name.trim()) {
            alert("아이디를 입력해 주세요.");
            return;
        }
        try {
            const res = await checkUsername(user.user_name);
            alert(res.message);
        } catch (err) {
            alert("아이디 중복 확인 중 오류가 발생했습니다.");
        }
    };

    // changeValue: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
    const changeValue = (e) => {
        setUser({
            ...user,
            [e.target.name]: e.target.value,
        });
    };

    // submitRegister: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
    const submitRegister = async (e) => {
        e.preventDefault();

        if (user.password !== user.passwordCheck) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        const requestData = {
            user_name: user.user_name,
            email: user.email,
            password: user.password,
        };

        try {
            await register(requestData);
            alert("회원가입이 완료되었습니다! 취향 설정 페이지로 이동합니다.");
            try {
                await login(user.user_name, user.password);
                navigate("/moodfit/preference");
            } catch (loginError) {
                console.error("자동 로그인 처리 중 오류:", loginError);
                navigate("/moodfit/login");
            }
        } catch (error) {
            console.error(error);
            const detailMsg = error.response?.data?.detail;
            if (detailMsg && typeof detailMsg === "string") {
                alert(detailMsg);
            } else {
                alert("회원가입에 실패했습니다. 다시 시도해주세요.");
            }
        }
    };

    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
    return (
        <main className="register-page">
            <section className="register-card">
                <div className="register-title">
                    <UserPlus size={34} />
                    <h1>회원가입</h1>
                    <p>MOOD FIT에서 나만의 맞춤 추천을 시작해보세요.</p>
                </div>

                <form className="register-form" onSubmit={submitRegister}>
                    <label>
                        아이디
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                type="text"
                                name="user_name"
                                placeholder="아이디를 입력하세요"
                                value={user.user_name}
                                onChange={changeValue}
                                required
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                onClick={handleCheckUsername}
                                style={{
                                    padding: "0 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #ddd",
                                    backgroundColor: "#f5f5f5",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                중복 확인
                            </button>
                        </div>
                    </label>

                    {/* <label>
                        이름
                        <input
                            type="text"
                            name="name"
                            placeholder="이름을 입력하세요"
                            value={user.name}
                            onChange={changeValue}
                            required
                        />
                    </label> */}

                    <label>
                        이메일
                        <input
                            type="email"
                            name="email"
                            placeholder="example@email.com"
                            value={user.email}
                            onChange={changeValue}
                            required
                        />
                    </label>

                    <label>
                        비밀번호
                        <div className="password-box">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="비밀번호를 입력하세요"
                                value={user.password}
                                onChange={changeValue}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </label>

                    <label>
                        비밀번호 확인
                        <input
                            type="password"
                            name="passwordCheck"
                            placeholder="비밀번호를 다시 입력하세요"
                            value={user.passwordCheck}
                            onChange={changeValue}
                            required
                        />
                    </label>

                    <button type="submit" className="register-button">
                        회원가입
                    </button>
                </form>
            </section>
        </main>
    );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default RegisterPage;