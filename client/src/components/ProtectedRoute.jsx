import { Navigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

const ProtectedRoute = ({ children }) => {
    const { userInfo } = useAppStore();

    if (!userInfo) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
