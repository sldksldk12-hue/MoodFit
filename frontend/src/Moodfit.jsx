import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ChatBot from "./components/chat/ChatBot";
import Header from "./components/common/layout/header/Header";
import Footer from "./components/common/layout/Footer";
import ScrollToTop from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/common/route/ProtectedRoute";
import { AuthProvider } from "./store/AuthContext";
import MainPage from "./pages/MainPage";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DetailPage = lazy(() => import("./pages/DetailPage"));
const ProductListPage = lazy(() => import("./pages/ProductList"));
const RecomendList = lazy(() => import("./pages/RecomendList"));
const CartPage = lazy(() => import("./pages/CartPage"));
const PreferencePage = lazy(() => import("./pages/PreferencePage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const MyPage = lazy(() => import("./pages/MyPage"));
const OrderHistoryPage = lazy(() => import("./pages/OrderHistoryPage"));
const RecentHistoryPage = lazy(() => import("./pages/RecentHistoryPage"));
const AddressManagementPage = lazy(() => import("./pages/AddressManagementPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

const Moodfit = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Header />

        <Suspense
          fallback={
            <main
              style={{
                minHeight: "60vh",
                padding: "80px",
                textAlign: "center",
              }}
            >
              페이지를 불러오는 중입니다.
            </main>
          }
        >
          <Routes>

            {/* 공개 페이지 */}
            <Route path="/moodfit" element={<MainPage />} />
            <Route path="/moodfit/login" element={<LoginPage />} />
            <Route path="/moodfit/register" element={<RegisterPage />} />
            <Route path="/moodfit/detail/:id" element={<DetailPage />} />
            <Route path="/moodfit/list" element={<ProductListPage />} />
            <Route path="/moodfit/ailist" element={<RecomendList />} />

            {/* 로그인 필요 */}
            <Route
              path="/moodfit/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/moodfit/payment"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/moodfit/mypage"
              element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/moodfit/preference"
              element={
                <ProtectedRoute>
                  <PreferencePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/moodfit/orders"
              element={
                <ProtectedRoute>
                  <OrderHistoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/moodfit/history"
              element={
                <ProtectedRoute>
                  <RecentHistoryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/moodfit/addresses"
              element={
                <ProtectedRoute>
                  <AddressManagementPage />
                </ProtectedRoute>
              }
            />

            {/* 관리자 */}
            <Route
              path="/moodfit/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

          </Routes>
        </Suspense>

        <ChatBot />
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default Moodfit;