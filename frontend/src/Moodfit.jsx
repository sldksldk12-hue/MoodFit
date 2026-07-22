/**
 * 최상위 라우팅
 *
 * 페이지 컴포넌트를 React.lazy로 분리해 첫 접속 때 필요한 JavaScript만 내려받습니다.
 * 사용자가 특정 페이지로 이동할 때 해당 페이지 코드가 추가로 로드됩니다.
 */
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ChatBot from "./components/chat/ChatBot";
import Header from "./components/common/layout/header/Header";
import Footer from "./components/common/layout/Footer";
import { AuthProvider } from "./store/AuthContext";
import ProtectedRoute from "./components/common/route/ProtectedRoute";
import ScrollToTop from "./components/common/ScrollToTop";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const MainPage2 = lazy(() => import("./pages/MainPage2"));
const DetailPage = lazy(() => import("./pages/DetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const ProductListPage = lazy(() => import("./pages/ProductList"));
const RecomendList = lazy(() => import("./pages/RecomendList"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const MyPage = lazy(() => import("./pages/MyPage"));
const PreferencePage = lazy(() => import("./pages/PreferencePage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

const RouteLoading = () => (
  <main style={{ minHeight: "60vh", padding: "80px", textAlign: "center" }}>
    페이지를 불러오는 중입니다.
  </main>
);

const Moodfit = () => (
  <AuthProvider>
    <BrowserRouter>
      <ScrollToTop />
      <Header />

      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/moodfit" element={<MainPage2 />} />
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
      </Suspense>

      <ChatBot />
      <Footer />
    </BrowserRouter>
  </AuthProvider>
);

export default Moodfit;
