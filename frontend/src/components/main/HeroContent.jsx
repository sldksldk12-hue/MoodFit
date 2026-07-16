/**
 * 파일: src/components/main/HeroContent.jsx
 * 분류: 메인 페이지 전용 컴포넌트
 *
 * 역할
 * - 메인 Hero 영역에서 축제 정보와 AI 추천 시작 입력창을 제공합니다.
 *
 * 사용 기술
 * - Axios API 호출, Redux 입력 상태, useEffect/useState
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { Bot } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getFestival } from "../../services/api";
import { openMainChat, setHeroInput } from "../../store/slices/chatSlice";
import "../../assets/styles/main/HeroContent.css";

/**
 * HeroContent 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const HeroContent = () => {
  // Redux Store에 상태 변경 명령(action)을 전달하기 위한 dispatch 함수입니다.
  const dispatch = useDispatch();
  // 여러 컴포넌트가 공유하는 Redux 상태에서 현재 화면에 필요한 값만 선택합니다.
  const heroInput = useSelector((state) => state.chat.heroInput);
  // festival: 이 컴포넌트 안에서만 필요한 화면 상태이므로 useState로 관리합니다.
  const [festival, setFestival] = useState(null);

  // 컴포넌트 렌더링 이후 API 호출, DOM 동기화 또는 이벤트 정리가 필요할 때 실행합니다.
  useEffect(() => {
    // loadFestival: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
    const loadFestival = async () => {
      try {
        const data = await getFestival();
        const festivalData = Array.isArray(data) ? data[0] : data;
        setFestival(festivalData ?? null);
      } catch (error) {
        console.error("축제 정보 불러오기 실패:", error);
        setFestival(null);
      }
    };

    loadFestival();
  }, []);

  // handleOpenChat: 사용자 이벤트 또는 데이터 처리 과정을 한 함수로 분리해 JSX를 단순하게 유지합니다.
  const handleOpenChat = () => {
    dispatch(openMainChat());
  };

  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <div className="hero-text">
      <span className="eyebrow">AI CLOTHING RECOMMENDATION</span>

      <div className="festival-slider">
        <div className="festival-slide">
          <h1>
            {festival
              ? `${festival.title}이 시작되었습니다!`
              : "오늘의 축제를 불러오는 중..."}
          </h1>
          <p>
            {festival
              ? `${festival.title}에 어울리는 축제 코디를 만나보세요.`
              : "축제 정보를 불러오는 중입니다."}
          </p>
        </div>
      </div>

      <div className="ai-input-box">
        <input
          type="text"
          className="ai-input"
          placeholder="어떤 상품이 필요하신가요?"
          value={heroInput}
          onChange={(event) => dispatch(setHeroInput(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && heroInput.trim()) handleOpenChat();
          }}
        />
      </div>

      <button type="button" className="primary-button" onClick={handleOpenChat}>
        <Bot size={19} />
        AI 추천 시작
      </button>

      <p className="hero-description">
        기상청 API, 사용자 취향 등을 바탕으로 개인 맞춤 추천을 제공합니다.
      </p>
    </div>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default HeroContent;
