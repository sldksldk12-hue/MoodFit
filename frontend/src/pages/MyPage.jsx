import { Heart, ShoppingBag, User, Settings, MapPin, Sparkles } from "lucide-react";
import "../assets/styles/Mypage.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

const MyPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // Assuming you have a useAuth hook to get the user information
    console.log("User info:", user); // Log the user information to the console for debugging
    console.log("User name:", user.user_name); // Log the user's name to the console for debugging

    const orders = [
        { id: 1, name: "오버핏 블랙 후드티", date: "2026.07.10", status: "배송완료", price: 39000 },
        { id: 2, name: "베이지 트렌치코트", date: "2026.07.08", status: "배송중", price: 89000 },
    ];

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

export default MyPage;