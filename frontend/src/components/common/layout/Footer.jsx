/**
 * 파일: src/components/common/layout/Footer.jsx
 * 분류: 공통 UI 컴포넌트
 *
 * 역할
 * - 모든 페이지 하단에 공통으로 표시되는 서비스 정보 영역을 렌더링합니다.
 *
 * 사용 기술
 * - React 함수형 컴포넌트
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import '../../../assets/styles/common/layout/Footer.css';

/**
 * Footer 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const Footer = () => {
  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <h3>MOOD FIT</h3>
          <p>날씨, 목적, 기분, 구매 로그를 분석하여 개인화 의류 추천을 제공하는 AI 쇼핑몰입니다.</p>
        </div>

        <div>
          <h4>고객센터</h4>
          <p>AM 09:00 - PM 06:00</p>
          <p>점심시간 PM 12:00 - PM 01:00</p>
          <p>토요일, 일요일, 공휴일 휴무</p>
        </div>

        <div>
          <h4>메뉴</h4>
          <a href="#new">신상품</a>
          <a href="#best">베스트셀러</a>
          <a href="#sale">시즌오프</a>
          <a href="#ai">AI 추천</a>
        </div>

        <div>
          <h4>프로젝트 기능</h4>
          <p>기상청 API</p>
          <p>LLM 챗봇</p>
          <p>Vector DB 추천</p>
          <p>사용자 로그 분석</p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 STYLE AI. Capstone Design Project.
      </div>
    </footer>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default Footer;
