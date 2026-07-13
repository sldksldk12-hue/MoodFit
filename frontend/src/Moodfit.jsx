import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import MainPage2 from "./pages/MainPage2";
import DetailPage from "./pages/DetailPage";
import CartPage from "./pages/CartPage";
import ProductListPage from "./pages/ProductList";
import RecomendList from "./pages/RecomendList";
import ChatBot from "./components/ChatBot";
import Header from "./components/Header";
import Footer from "./components/Footer";
import RegisterPage from "./pages/RegisterPage";
import MyPage from "./pages/MyPage";
import PreferencePage from "./pages/PreferencePage";
import PaymentPage from "./pages/PaymentPage";
import AdminPage from "./pages/AdminPage";
import { AuthProvider } from "./store/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import WeatherBackground from "./components/weather/WeatherBackground";

const Moodfit = () => {
  const [chatMessage, setChatMessage] = useState("");
  return (
    <AuthProvider>

      <BrowserRouter>
        <WeatherBackground theme="rain">
          <Header />
          <Routes>

            {/* 메인페이지 */}
            <Route
              path="/"
              element={
                <MainPage2
                  chatMessage={chatMessage}
                  setChatMessage={setChatMessage}
                />
              }
            />
            <Route path="/moodfit/detail" element={<DetailPage />} />

            {/* 로그인 */}
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
          <ChatBot chatMessage={chatMessage} />
          <Footer />
        </WeatherBackground>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default Moodfit;