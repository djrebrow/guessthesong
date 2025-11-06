import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RosterPage from './RosterPage';
import AdminLoginForm from '../components/auth/AdminLoginForm';
import { useAuthStore } from '../state/useAuthStore';

const AdminPortal = () => {
  const navigate = useNavigate();
  const status = useAuthStore((state) => state.status);
  const initializeAuth = useAuthStore((state) => state.initialize);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (status === 'idle') {
      void initializeAuth();
    }
  }, [status, initializeAuth]);

  useEffect(() => {
    return () => {
      void logout();
    };
  }, [logout]);

  if (status !== 'authenticated') {
    return <AdminLoginForm />;
  }

  return (
    <RosterPage
      allowEditing
      onNavigatePublic={() => navigate('/')}
      onNavigateAdmin={undefined}
      onLogout={() => {
        void logout();
      }}
    />
  );
};

export default AdminPortal;
