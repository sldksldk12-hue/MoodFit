import '../assets/styles/Footer.css';

const Footer = () => {
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

export default Footer;
