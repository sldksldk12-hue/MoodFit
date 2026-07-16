/**
 * 파일: src/pages/DetailPage.jsx
 * 분류: 라우팅 페이지
 *
 * 역할
 * - 상품 상세 정보, 옵션·수량 선택, 장바구니 추가, 상세 탭을 관리합니다.
 *
 * 사용 기술
 * - useState, Redux dispatch, 탭 UI
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { Heart, ShoppingCart, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import ProductDescription from "../components/detail/ProductDescription";
import ProductReview from "../components/detail/ProductReview";
import ProductQna from "../components/detail/ProductQna";
import { addToCart } from "../store/slices/cartSlice";
import "../assets/styles/detail/DetailPage.css";

const product = {
  id: 1,
  name: "오버핏 블랙 후드티",
  category: "NEW",
  desc: "편안한 꾸안꾸 데일리룩",
  price: 39000,
  image: "/images/product01.jpg",
};

/**
 * DetailPage 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const DetailPage = () => {
  // Redux Store에 상태 변경 명령(action)을 전달하기 위한 dispatch 함수입니다.
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // tab: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
  const [tab, setTab] = useState("desc");
  // size: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
  const [size, setSize] = useState("M");
  // quantity: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
  const [quantity, setQuantity] = useState(1);

  // handleAddCart: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
  const handleAddCart = () => {
    dispatch(
      addToCart({
        ...product,
        option: `블랙 / ${size}`,
        quantity,
        cartKey: `${product.id}-${size}`,
      })
    );
    alert("장바구니에 상품을 담았습니다.");
  };

  // handleBuyNow: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
  const handleBuyNow = () => {
    handleAddCart();
    navigate("/moodfit/cart");
  };

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <main className="detail-page">
      <section className="detail-container">
        <div className="detail-image-box">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="detail-info">
          <span className="detail-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="detail-desc">{product.desc}</p>
          <div className="detail-price">{product.price.toLocaleString()}원</div>

          <div className="detail-option">
            <label>사이즈</label>
            <div className="size-buttons">
              {["S", "M", "L", "XL"].map((itemSize) => (
                <button
                  type="button"
                  key={itemSize}
                  className={size === itemSize ? "active" : ""}
                  onClick={() => setSize(itemSize)}
                >
                  {itemSize}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-option">
            <label>수량</label>
            <select
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            >
              {[1, 2, 3, 4].map((count) => (
                <option key={count} value={count}>
                  {count}개
                </option>
              ))}
            </select>
          </div>

          <div className="detail-buttons">
            <button type="button" className="cart-btn" onClick={handleAddCart}>
              <ShoppingCart size={20} />
              장바구니
            </button>
            <button type="button" className="buy-btn" onClick={handleBuyNow}>
              바로 구매
            </button>
            <button type="button" className="like-btn">
              <Heart size={22} />
            </button>
          </div>

          <div className="detail-benefits">
            <div><Truck size={20} />무료배송</div>
            <div><ShieldCheck size={20} />안전결제</div>
            <div><RotateCcw size={20} />7일 교환/반품</div>
          </div>
        </div>
      </section>

      <section className="detail-additional">
        <div className="detail-tabs">
          <button className={`detail-tab ${tab === "desc" ? "active" : ""}`} onClick={() => setTab("desc")}>상품 설명</button>
          <button className={`detail-tab ${tab === "review" ? "active" : ""}`} onClick={() => setTab("review")}>상품 후기</button>
          <button className={`detail-tab ${tab === "qna" ? "active" : ""}`} onClick={() => setTab("qna")}>상품 Q&A</button>
        </div>
        <div className="detail-tab-contents">
          {tab === "desc" && <ProductDescription product={product} />}
          {tab === "review" && <ProductReview />}
          {tab === "qna" && <ProductQna />}
        </div>
      </section>
    </main>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default DetailPage;
