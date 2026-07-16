/**
 * 파일: src/pages/AdminPage.jsx
 * 분류: 라우팅 페이지
 *
 * 역할
 * - 관리자 기능의 탭과 관리 데이터를 한 화면에서 구성합니다.
 *
 * 사용 기술
 * - useState, 탭 조건부 렌더링
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import "../assets/styles/pages/admin/AdminPage.css";

/**
 * AdminPage 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const AdminPage = () => {
  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h3>관리 메뉴</h3>

        <button className="active">🏠 대시보드</button>
        <button>🛍 상품관리</button>
        <button>🛒 주문관리</button>
        <button>💬 문의관리</button>
      </aside>

      <main className="admin-main">
        <section className="admin-section">
          <h2>KPI 요약 영역</h2>

          <div className="kpi-grid">
            <div className="kpi-card">
              <span>총 매출</span>
              <strong>2,450,000원</strong>
            </div>

            <div className="kpi-card">
              <span>오늘 주문</span>
              <strong>32건</strong>
            </div>

            <div className="kpi-card">
              <span>회원 수</span>
              <strong>1,240명</strong>
            </div>

            <div className="kpi-card">
              <span>문의</span>
              <strong>8건</strong>
            </div>
          </div>
        </section>

        <section className="admin-section">
          <h2>상품관리</h2>

          <table className="admin-table">
            <thead>
              <tr>
                <th>상품명</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>재고</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>오버핏 블랙 후드티</td>
                <td>상의</td>
                <td>39,000원</td>
                <td>24</td>
                <td>
                  <button>수정</button>
                  <button>삭제</button>
                </td>
              </tr>

              <tr>
                <td>베이지 트렌치코트</td>
                <td>아우터</td>
                <td>89,000원</td>
                <td>12</td>
                <td>
                  <button>수정</button>
                  <button>삭제</button>
                </td>
              </tr>

              <tr>
                <td>와이드 데님 팬츠</td>
                <td>하의</td>
                <td>49,000원</td>
                <td>31</td>
                <td>
                  <button>수정</button>
                  <button>삭제</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="admin-bottom">
          <section className="admin-section half">
            <h2>주문관리</h2>
            <table className="admin-table small">
              <tbody>
                <tr>
                  <td>#1001</td>
                  <td>배송중</td>
                  <td>88,000원</td>
                </tr>
                <tr>
                  <td>#1002</td>
                  <td>결제완료</td>
                  <td>39,000원</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="admin-section half">
            <h2>문의관리</h2>
            <table className="admin-table small">
              <tbody>
                <tr>
                  <td>배송 문의</td>
                  <td>답변대기</td>
                </tr>
                <tr>
                  <td>사이즈 문의</td>
                  <td>답변완료</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <section className="admin-section tag-section">
          <h2>AI 자동태깅 보조 영역</h2>

          <div className="tag-box">
            <input placeholder="상품명 또는 설명을 입력하세요" />
            <button>태그 추천</button>
          </div>

          <div className="tag-list">
            <span>캐주얼</span>
            <span>여름</span>
            <span>축제</span>
            <span>야외</span>
            <span>편안함</span>
          </div>
        </section>
      </main>
    </div>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default AdminPage;