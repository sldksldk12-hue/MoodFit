import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { isLogin, loading } = useAuth();
    const location = useLocation();

    if (loading) return <>Loading...</>;

    if (!isLogin) {
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
export default ProtectedRoute;