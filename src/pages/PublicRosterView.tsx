import { useNavigate } from 'react-router-dom';
import RosterPage from './RosterPage';

const PublicRosterView = () => {
  const navigate = useNavigate();
  return <RosterPage allowEditing={false} onNavigateAdmin={() => navigate('/admin')} />;
};

export default PublicRosterView;
