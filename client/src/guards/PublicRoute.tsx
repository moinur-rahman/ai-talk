import { Navigate, Outlet } from 'react-router-dom';
import { useGetMeQuery } from '@/services/userApi';

const PublicRoute = () => {
  const { data: user, isLoading } = useGetMeQuery();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/new" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
