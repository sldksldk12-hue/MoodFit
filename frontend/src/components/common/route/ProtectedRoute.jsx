/**
 * 파일: src/components/common/route/ProtectedRoute.jsx
 * 분류: 공통 UI 컴포넌트
 *
 * 역할
 * - 로그인이 필요한 페이지의 접근을 제어하고 비로그인 사용자를 로그인 페이지로 이동시킵니다.
 *
 * 사용 기술
 * - React Router Navigate, Auth Context
 *
 * 이 구조를 사용한 이유
 * - 페이지에서 반복되는 UI와 상태 로직을 파일 단위로 분리해 수정 범위를 줄입니다.
 * - 기능별 하위 폴더와 동일한 CSS 구조를 사용해 관련 파일을 쉽게 찾을 수 있습니다.
 * - 외부에서는 필요한 props 또는 Redux 상태만 사용하게 하여 컴포넌트 간 결합도를 낮춥니다.
 */
// 이 파일에서 사용하는 외부 라이브러리와 내부 모듈을 불러옵니다.
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../store/AuthContext";

/**
 * ProtectedRoute 컴포넌트
 * 부모에게 받은 props와 전역 상태를 조합해 화면을 렌더링합니다.
 */
const ProtectedRoute = ({ children }) => {
    const { isLogin, loading } = useAuth();
    const location = useLocation();

    if (loading) return <>Loading...</>;

    if (!isLogin) {
        // 상태에 따라 실제 브라우저에 표시할 JSX 구조를 반환합니다.
        return (
            <Navigate
                to="/moodfit/login"
                state={{ from: location }}
                replace
            />
        );
    }

    return children;
};
// 다른 파일에서 이 모듈을 기본 import할 수 있도록 내보냅니다.
export default ProtectedRoute;