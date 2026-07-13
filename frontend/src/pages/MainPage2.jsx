import { Bot, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import ChatPage from '../components/ChatPage';
import HeroContent from '../components/HeroContent';
import WeatherCard from '../components/WeatherCard';
import '../assets/styles/global.css';
import '../assets/styles/MainPage.css';
import { getList } from '../services/api';
import WeatherBackground from '../components/weather/WeatherBackground';

// const products = [
//     {
//         id: 1,
//         name: '오버핏 블랙 후드티',
//         category: 'NEW',
//         desc: '편안한 꾸안꾸 데일리룩',
//         price: 39000,
//         image: '/images/product01.jpg',
//     },
//     {
//         id: 2,
//         name: '베이지 트렌치코트',
//         category: 'BEST',
//         desc: '비 오는 날에도 잘 어울리는 아우터',
//         price: 89000,
//         image: '/images/product02.jpg',
//     },
//     {
//         id: 3,
//         name: '와이드 데님 팬츠',
//         category: 'BEST',
//         desc: '어떤 상의와도 잘 맞는 기본템',
//         price: 49000,
//         image: '/images/product03.jpg',
//     },
// ];

const banners = [
    { title: 'WEEKLY EVENT', desc: '이번 주 특별 할인', image: '/images/banner01.jpg' },
    { title: 'SHOPPING LIVE', desc: '라이브 인기 상품', image: '/images/banner02.jpg' },
    { title: 'NEW COLLECTION', desc: '새로운 시즌 컬렉션', image: '/images/banner03.jpg' },
];

const MainPage2 = ({ chatMessage, setChatMessage}) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMode, setChatMode] = useState("full");
    const [product, setProduct] = useState([{
        id: "",
        product_name: '',
        price: '',
        image_url: '',
    }])



    const openChatWithMessage = () => {
        setIsChatOpen(true);
    };
    useEffect(() => {
        getList()
            .then(data => {
                console.log(data)
                setProduct(data);
            }
            )
        console.log(product)
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


    return (
        <>
            
            <main>

                {!isChatOpen && (
                    <section className="hero-section">
                        <HeroContent
                            openChat={openChatWithMessage}
                            chatMessage={chatMessage}
                            setChatMessage={setChatMessage}
                        />

                        <WeatherCard />
                    </section>
                )}
                {isChatOpen && (
                    <section className="chat-sticky-section">
                        <ChatPage
                            mode={chatMode}
                            closeChat={() => setIsChatOpen(false)}
                            firstMessage={chatMessage}
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
                                <img src={banner.image} alt={banner.title} />
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
                        {product.map((product) => (
                            <ProductCard product={product} key={product.id} />
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
                        {product.concat(product).map((product, index) => (
                            <ProductCard product={{ ...product, id: index + 10 }} key={index} />
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

export default MainPage2;
