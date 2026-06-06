import { Navigate, Outlet } from 'react-router-dom';
import { useGetMeQuery } from '@/services/userApi';

const ProtectedRoute = () => {
  const { data: user, isLoading, isError } = useGetMeQuery();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
