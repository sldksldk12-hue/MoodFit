/**
 * 파일: src/pages/MainPage2.jsx
 * 분류: 라우팅 페이지
 *
 * 역할
 * - 메인 Hero·날씨 카드·추천 상품·메인 채팅 영역을 조합합니다.
 *
 * 사용 기술
 * - Redux UI 상태, useEffect, 조건부 렌더링
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { PlayCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProductCard from '../components/product/ProductCard';
import ProductGridSkeleton from '../components/product/ProductGridSkeleton';
import ChatPage from '../components/chat/ChatPage';
import HeroContent from '../components/main/HeroContent';
import WeatherCard from '../components/main/WeatherCard';
import '../assets/styles/global.css';
import '../assets/styles/main/MainPage.css';
import { getList } from '../services/api';
import { closeMainChat } from '../store/slices/chatSlice';


const banners = [
    { title: 'WEEKLY EVENT', desc: '이번 주 특별 할인', image: '/images/banner01.jpg' },
    { title: 'SHOPPING LIVE', desc: '라이브 인기 상품', image: '/images/banner02.jpg' },
    { title: 'NEW COLLECTION', desc: '새로운 시즌 컬렉션', image: '/images/banner03.jpg' },
];

/**
 * MainPage2 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const MainPage2 = () => {
    // Redux Store에 상태 변경 명령(action)을 전달하기 위한 dispatch 함수입니다.
    const dispatch = useDispatch();
    // 여러 컴포넌트가 공유하는 Redux 상태에서 현재 화면에 필요한 값만 선택합니다.
    const isChatOpen = useSelector((state) => state.chat.mainChatOpen);
    // chatMode: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
    const [chatMode, setChatMode] = useState("full");
    // product: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
    const [product, setProduct] = useState([]);
    const [productLoading, setProductLoading] = useState(true);

    // 상품 데이터가 바뀔 때만 정렬하여 렌더링마다 sort가 반복되지 않게 합니다.
    const newestProducts = useMemo(() => [...product].sort(
        (a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0)
    ), [product]);
    const bestProducts = useMemo(() => [...product].sort(
        (a, b) => Number(b.like_count ?? 0) - Number(a.like_count ?? 0)
    ), [product]);

    // 컴포넌트 렌더링 이후 API 호출, DOM 동기화 또는 이벤트 정리가 필요할 때 실행합니다.
    useEffect(() => {
        getList()
            .then((data) => setProduct(Array.isArray(data) ? data : []))
            .catch((error) => console.error("상품 목록 조회 실패:", error))
            .finally(() => setProductLoading(false));
        // handleScroll: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
        const handleScroll = () => {
            if (window.scrollY > 250) {
                setChatMode("sticky");
            } else {
                setChatMode("full");
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);


    // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
    return (
        <>

            <main>

                {!isChatOpen && (
                    <section className="hero-section">
                        <HeroContent />

                        <WeatherCard />
                    </section>
                )}
                {isChatOpen && (
                    <section className="chat-sticky-section">
                        <ChatPage
                            mode={chatMode}
                            closeChat={() => dispatch(closeMainChat())}
                        />
                    </section>
                )}

                <section className="section">
                    <div className="section-title">
                        <div>
                            <h2>스페셜 이벤트</h2>
                            <p>진행중 이벤트 & 프로모션</p>
                        </div>
                    </div>

                    <div className="banner-grid">
                        {banners.map((banner) => (
                            <a href="#" className="event-banner" key={banner.title}>
                                <img src={banner.image} alt={banner.title} loading="lazy" decoding="async" />
                                <div>
                                    <h3>{banner.title}</h3>
                                    <p>{banner.desc}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>

                <section className="section" id="new">
                    <div className="section-title">
                        <div>
                            <h2>신상품</h2>
                            <p>새롭게 출시된 상품들</p>
                        </div>
                        <a href="#">전체보기</a>
                    </div>

                    <div className="product-grid">
                            {productLoading ? <ProductGridSkeleton count={4} /> : newestProducts.map((product) => (
                                    <ProductCard
                                        product={product}
                                        key={product.id}
                                    />
                                ))}
                    </div>

                </section>

                <section className="brand-video">
                    <div className="video-box">
                        <PlayCircle size={56} />
                    </div>
                    <div>
                        <span className="eyebrow">BRAND STORY</span>
                        <h2>지속가능한 스타일을 위한 AI 쇼핑 경험</h2>
                        <p>
                            사용자의 목적과 취향을 이해하고, 날씨와 상황에 어울리는 상품을 추천합니다.
                        </p>
                    </div>
                </section>

                <section className="section" id="best">
                    <div className="section-title">
                        <div>
                            <h2>베스트 셀러</h2>
                            <p>금주의 베스트 아이템</p>
                        </div>
                    </div>
                    <div className="product-grid">
                        {productLoading ? <ProductGridSkeleton count={4} /> : bestProducts.map((product) => (
                            <ProductCard
                                product={product}
                                key={`best-${product.id}`}
                            />
                        ))}
                    </div>
                </section>

                <section className="trend-banner" id="sale">
                    <h2>TREND PICK</h2>
                    <p>지금 바로 MOOD FIT의 인기 상품을 만나보세요.</p>
                    <button type="button">자세히 보기</button>
                </section>
            </main>

        </>
    );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default MainPage2;
