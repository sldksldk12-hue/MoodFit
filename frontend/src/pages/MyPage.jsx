/**
 * 파일: src/pages/MyPage.jsx
 * 분류: 라우팅 페이지
 *
 * 역할
 * - 로그인 사용자의 정보와 주문·활동 메뉴를 표시합니다.
 *
 * 사용 기술
 * - Auth Context, React Router
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { Heart, ShoppingBag, User, Settings, MapPin, Sparkles } from "lucide-react";
import "../assets/styles/pages/mypage/Mypage.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

/**
 * MyPage 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const MyPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // Assuming you have a useAuth hook to get the user information
    console.log("User info:", user); // Log the user information to the console for debugging
    console.log("User name:", user.user_name); // Log the user's name to the console for debugging

    const orders = [
        { id: 1, name: "오버핏 블랙 후드티", date: "2026.07.10", status: "배송완료", price: 39000 },
        { id: 2, name: "베이지 트렌치코트", date: "2026.07.08", status: "배송중", price: 89000 },
    ];

    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
    return (
        <main className="mypage">
            <section className="mypage-profile">
                <div className="profile-icon">
                    <User size={42} />
                </div>

                <div>
                    <h1>{user.user_name}님</h1>
                    <p>{user.email}</p>
                    {/* <span>{user.grade}</span>  */}
                </div>
            </section>

            <section className="mypage-summary">
                <div>
                    {/* <strong>{user.point.toLocaleString()}P</strong> */}
                    <p>포인트</p>
                </div>
                <div>
                    <strong>2</strong>
                    <p>주문내역</p>
                </div>
                <div>
                    <strong>8</strong>
                    <p>찜한상품</p>
                </div>
            </section>

            <section className="mypage-menu">
                <button className="mypage-menu-btn">
                    <ShoppingBag size={22} />
                    주문내역
                </button>
                <button className="mypage-menu-btn">
                    <Heart size={22} />
                    찜한 상품
                </button>
                <button className="mypage-menu-btn" onClick={() => navigate("/moodfit/preference")}>
                    <Sparkles size={22} />
                    취향등록
                </button>
                <button className="mypage-menu-btn">
                    <MapPin size={22} />
                    배송지 관리
                </button>
                <button className="mypage-menu-btn">
                    <Settings size={22} />
                    회원정보 수정
                </button>
            </section>

            <section className="mypage-orders">
                <h2>최근 주문내역</h2>

                {orders.map(order => (
                    <div className="order-item" key={order.id}>
                        <div>
                            <h3>{order.name}</h3>
                            <p>{order.date}</p>
                        </div>

                        <span>{order.status}</span>

                        <strong>{order.price.toLocaleString()}원</strong>
                    </div>
                ))}
            </section>
        </main>
    );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default MyPage;