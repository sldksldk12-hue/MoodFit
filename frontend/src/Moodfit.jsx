/**
 * 파일: src/Moodfit.jsx
 * 분류: 애플리케이션 구성 모듈
 *
 * 역할
 * - 애플리케이션의 최상위 라우팅과 공통 레이아웃을 구성합니다.
 *
 * 사용 기술
 * - React Router, Context Provider, 공통 레이아웃 조합
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import MainPage2 from "./pages/MainPage2";
import DetailPage from "./pages/DetailPage";
import CartPage from "./pages/CartPage";
import ProductListPage from "./pages/ProductList";
import RecomendList from "./pages/RecomendList";
import ChatBot from "./components/chat/ChatBot";
import Header from "./components/common/layout/Header";
import Footer from "./components/common/layout/Footer";
import RegisterPage from "./pages/RegisterPage";
import MyPage from "./pages/MyPage";
import PreferencePage from "./pages/PreferencePage";
import PaymentPage from "./pages/PaymentPage";
import AdminPage from "./pages/AdminPage";
import { AuthProvider } from "./store/AuthContext";
import ProtectedRoute from "./components/common/route/ProtectedRoute";
import WeatherBackground from "./components/weather/WeatherBackground";
import ScrollToTop from "./assets/styles/common/ScrollToTop";

/**
 * Moodfit 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const Moodfit = () => {
  // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
  return (
    <AuthProvider>
      <BrowserRouter>
          <ScrollToTop />
          <Header />

          <Routes>
            <Route path="/" element={<MainPage2 />} />
            <Route path="/moodfit/detail/:id" element={<DetailPage />} />
            <Route path="/moodfit/login" element={<LoginPage />} />
            <Route path="/moodfit/cart" element={<CartPage />} />
            <Route path="/moodfit/list" element={<ProductListPage />} />
            <Route path="/moodfit/ailist" element={<RecomendList />} />
            <Route path="/moodfit/register" element={<RegisterPage />} />
            <Route
              path="/moodfit/mypage"
              element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              }
            />
            <Route path="/moodfit/preference" element={<PreferencePage />} />
            <Route path="/moodfit/payment" element={<PaymentPage />} />
            <Route path="/moodfit/admin" element={<AdminPage />} />
          </Routes>

          <ChatBot />
          <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
};

// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default Moodfit;
