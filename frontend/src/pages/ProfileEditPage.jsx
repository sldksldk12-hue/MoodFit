import { useState, useEffect } from "react";
import { UserCheck, Lock, Mail, Save, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMe, updateProfile } from "../services/api";
import "../assets/styles/pages/auth/RegisterPage.css";

const ProfileEditPage = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({
        user_account: "",
        email: "",
        current_password: "",
        new_password: "",
        new_password_check: "",
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMe()
            .then((res) => {
                const data = res.data;
                setUserInfo((prev) => ({
                    ...prev,
                    user_account: data.user_account || data.user_name || "",
                    email: data.email || "",
                }));
            })
            .catch((err) => {
                console.error("내 정보 불러오기 실패:", err);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        setUserInfo({
            ...userInfo,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (userInfo.new_password && userInfo.new_password !== userInfo.new_password_check) {
            alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
            return;
        }

        if (userInfo.new_password && !userInfo.current_password) {
            alert("비밀번호를 변경하려면 현재 비밀번호를 입력해 주세요.");
            return;
        }

        try {
            const payload = {
                email: userInfo.email,
                current_password: userInfo.current_password || null,
                new_password: userInfo.new_password || null,
            };

            await updateProfile(payload);
            alert("회원 정보가 성공적으로 수정되었습니다.");
            navigate("/moodfit/mypage");
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "회원 정보 수정 중 오류가 발생했습니다.");
        }
    };

    if (loading) {
        return (
            <main className="register-page">
                <section className="register-card" style={{ textAlign: "center", padding: "60px" }}>
                    회원 정보를 불러오는 중입니다...
                </section>
            </main>
        );
    }

    return (
        <main className="register-page">
            <section className="register-card">
                <div className="register-title">
                    <UserCheck size={34} />
                    <h1>회원 정보 수정</h1>
                    <p>계정 이메일 및 비밀번호 정보를 변경합니다.</p>
                </div>

                <form className="register-form" onSubmit={handleSubmit}>
                    <label>
                        아이디 (변경 불가)
                        <input
                            type="text"
                            value={userInfo.user_account}
                            disabled
                            style={{ backgroundColor: "#f0f0f0", color: "#666", cursor: "not-allowed" }}
                        />
                    </label>

                    <label>
                        이메일 주소
                        <input
                            type="email"
                            name="email"
                            placeholder="example@email.com"
                            value={userInfo.email}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #eee" }} />

                    <h3 style={{ fontSize: "16px", marginBottom: "10px", color: "#333" }}>비밀번호 변경 (선택사항)</h3>

                    <label>
                        현재 비밀번호 (비밀번호 변경 시 필수)
                        <input
                            type="password"
                            name="current_password"
                            placeholder="현재 비밀번호를 입력하세요"
                            value={userInfo.current_password}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        새 비밀번호
                        <input
                            type="password"
                            name="new_password"
                            placeholder="변경할 새 비밀번호를 입력하세요"
                            value={userInfo.new_password}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        새 비밀번호 확인
                        <input
                            type="password"
                            name="new_password_check"
                            placeholder="새 비밀번호를 다시 입력하세요"
                            value={userInfo.new_password_check}
                            onChange={handleChange}
                        />
                    </label>

                    <button type="submit" className="register-button" style={{ marginTop: "20px" }}>
                        <Save size={18} style={{ marginRight: "6px" }} /> 정보 수정 완료
                    </button>
                </form>
            </section>
        </main>
    );
};

export default ProfileEditPage;
