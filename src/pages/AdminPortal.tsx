import { useNavigate } from 'react-router-dom';
import RosterPage from './RosterPage';

const AdminPortal = () => {
  const navigate = useNavigate();
  return <RosterPage allowEditing onNavigatePublic={() => navigate('/')} />;
};

export default AdminPortal;
