import React, { useState } from 'react';
import Sidebar, { PageType } from './Sidebar';
import NotificationsPage from '../pages/NotificationsPage';
import HistoryPage from '../pages/HistoryPage';
import './Dashboard.css';

interface DashboardProps {
  currentUser: string;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, onLogout }) => {
  const [currentPage, setCurrentPage] = useState<PageType>('history');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const getPageTitle = () => {
    const titles: Record<PageType, string> = {
      notifications: 'Notifications',
      history: 'History',
    };
    return titles[currentPage];
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'notifications':
        return <NotificationsPage />;
      case 'history':
        return <HistoryPage />;
      default:
        return <HistoryPage />;
    }
  };

  return (
    <div className="dashboard-root">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="main-content">
        <header className="header">
          <h1>{getPageTitle()}</h1>
          <div className="user-info">
            <span style={{ fontWeight: 600, marginRight: '12px' }}>{currentUser}</span>
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </header>
        <main className="page-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;