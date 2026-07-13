import { useState } from "react";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import "../assets/styles/RegisterPage.css";
import { register } from "../services/api";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        user_name: "",
        password: "",
        passwordCheck: "",
        email: "",
    });


    const [showPassword, setShowPassword] = useState(false);

    const changeValue = (e) => {
        setUser({
            ...user,
            [e.target.name]: e.target.value,
        });
    };

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
        await register(requestData)
            .then((response) => {
                alert("회원가입이 완료되었습니다.");
                // 회원가입 성공 후 로그인 페이지로 이동
                navigate("/moodfit/login");
            })
            .catch((error) => {
                console.error(error);
                alert("회원가입에 실패했습니다. 다시 시도해주세요.");
            });
    };

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
                        <input
                            type="text"
                            name="user_name"
                            placeholder="아이디를 입력하세요"
                            value={user.user_name}
                            onChange={changeValue}
                            required
                        />
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

export default RegisterPage;