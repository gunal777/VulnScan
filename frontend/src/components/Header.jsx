import { useLocation } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';

const routeNames = {
  '/': 'Dashboard',
  '/scan/new': 'New Scan',
  '/scans/recent': 'Recent Scans',
};

const Header = ({ onMobileMenuToggle }) => {
  const location = useLocation();

  // Determine the current page name
  const currentPage = routeNames[location.pathname] ||
    (location.pathname.startsWith('/scans/') ? 'Scan Report' : 'Dashboard');

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="header-breadcrumb">
          <span>VulnScan</span>
          <span className="separator">/</span>
          <span className="current">{currentPage}</span>
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="header-icon-btn" aria-label="Settings">
          <Settings size={18} />
        </button>
        <div className="header-avatar" title="User Profile">
          U
        </div>
      </div>
    </header>
  );
};

export default Header;
