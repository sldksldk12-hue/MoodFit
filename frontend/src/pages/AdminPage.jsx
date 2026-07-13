import React from "react";
import "../assets/styles/AdminPage.css";

const AdminPage = () => {
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

export default AdminPage;