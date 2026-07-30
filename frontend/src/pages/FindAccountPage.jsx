import { useState } from "react";
import { Search, Lock, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { findUsername, resetPassword } from "../services/api";
import "../assets/styles/pages/auth/LoginPage.css";

const FindAccountPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("findId"); // 'findId' | 'resetPw'

    // 아이디 찾기 상태
    const [findEmail, setFindEmail] = useState("");
    const [foundUsername, setFoundUsername] = useState("");

    // 비밀번호 재설정 상태
    const [resetData, setResetData] = useState({
        user_name: "",
        email: "",
        new_password: "",
        new_password_check: "",
    });

    const handleFindUsername = async (e) => {
        e.preventDefault();
        if (!findEmail.trim()) {
            alert("이메일을 입력해 주세요.");
            return;
        }
        try {
            const res = await findUsername(findEmail);
            setFoundUsername(res.user_account);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "해당 이메일로 가입된 아이디를 찾을 수 없습니다.");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetData.user_name || !resetData.email || !resetData.new_password) {
            alert("모든 정보를 입력해 주세요.");
            return;
        }
        if (resetData.new_password !== resetData.new_password_check) {
            alert("새 비밀번호가 일치하지 않습니다.");
            return;
        }
        try {
            const res = await resetPassword({
                user_name: resetData.user_name,
                email: resetData.email,
                new_password: resetData.new_password,
            });
            alert("비밀번호가 성공적으로 변경되었습니다! 로그인해 주세요.");
            navigate("/moodfit/login");
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "비밀번호 변경에 실패했습니다.");
        }
    };

    return (
        <main className="login-page">
            <section className="login-card" style={{ maxWidth: "460px" }}>
                <div className="login-title">
                    <KeyRound size={34} />
                    <h1>계정 정보 찾기</h1>
                    <p>아이디 찾기 및 비밀번호 재설정을 진행하실 수 있습니다.</p>
                </div>

                <div style={{ display: "flex", margin: "20px 0", borderBottom: "2px solid #eee" }}>
                    <button
                        type="button"
                        onClick={() => { setActiveTab("findId"); setFoundUsername(""); }}
                        style={{
                            flex: 1,
                            padding: "12px",
                            border: "none",
                            background: "none",
                            fontWeight: "bold",
                            borderBottom: activeTab === "findId" ? "3px solid #111" : "none",
                            color: activeTab === "findId" ? "#111" : "#888",
                            cursor: "pointer"
                        }}
                    >
                        아이디 찾기
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab("resetPw"); }}
                        style={{
                            flex: 1,
                            padding: "12px",
                            border: "none",
                            background: "none",
                            fontWeight: "bold",
                            borderBottom: activeTab === "resetPw" ? "3px solid #111" : "none",
                            color: activeTab === "resetPw" ? "#111" : "#888",
                            cursor: "pointer"
                        }}
                    >
                        비밀번호 재설정
                    </button>
                </div>

                {activeTab === "findId" ? (
                    <form className="login-form" onSubmit={handleFindUsername}>
                        <label>
                            가입한 이메일
                            <input
                                type="email"
                                placeholder="example@email.com"
                                value={findEmail}
                                onChange={(e) => setFindEmail(e.target.value)}
                                required
                            />
                        </label>

                        <button type="submit" className="login-submit-btn" style={{ marginTop: "10px" }}>
                            아이디 찾기
                        </button>

                        {foundUsername && (
                            <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "8px", textAlign: "center" }}>
                                <p style={{ fontSize: "14px", color: "#666" }}>고객님의 아이디입니다:</p>
                                <strong style={{ fontSize: "18px", color: "#111", display: "block", marginTop: "6px" }}>
                                    {foundUsername}
                                </strong>
                                <Link to="/moodfit/login" style={{ display: "inline-block", marginTop: "12px", color: "#007bff", fontWeight: "600" }}>
                                    로그인하러 가기 &rarr;
                                </Link>
                            </div>
                        )}
                    </form>
                ) : (
                    <form className="login-form" onSubmit={handleResetPassword}>
                        <label>
                            아이디
                            <input
                                type="text"
                                placeholder="아이디를 입력하세요"
                                value={resetData.user_name}
                                onChange={(e) => setResetData({ ...resetData, user_name: e.target.value })}
                                required
                            />
                        </label>

                        <label>
                            가입한 이메일
                            <input
                                type="email"
                                placeholder="example@email.com"
                                value={resetData.email}
                                onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                                required
                            />
                        </label>

                        <label>
                            새 비밀번호
                            <input
                                type="password"
                                placeholder="새 비밀번호를 입력하세요"
                                value={resetData.new_password}
                                onChange={(e) => setResetData({ ...resetData, new_password: e.target.value })}
                                required
                            />
                        </label>

                        <label>
                            새 비밀번호 확인
                            <input
                                type="password"
                                placeholder="새 비밀번호를 다시 입력하세요"
                                value={resetData.new_password_check}
                                onChange={(e) => setResetData({ ...resetData, new_password_check: e.target.value })}
                                required
                            />
                        </label>

                        <button type="submit" className="login-submit-btn" style={{ marginTop: "10px" }}>
                            비밀번호 변경
                        </button>
                    </form>
                )}

                <div style={{ textAlign: "center", marginTop: "24px" }}>
                    <Link to="/moodfit/login" style={{ color: "#666", fontSize: "14px", textDecoration: "none" }}>
                        &larr; 로그인 화면으로 돌아가기
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default FindAccountPage;
