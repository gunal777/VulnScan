import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ScanSearch, ClockArrowUp, Shield } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/scan/new', label: 'New Scan', icon: ScanSearch },
  { path: '/scans/recent', label: 'Recent Scans', icon: ClockArrowUp },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Shield size={18} />
          </div>
          <div>
            <div className="sidebar-title">VulnScan</div>
            <div className="sidebar-subtitle">Security Platform</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon className="link-icon" size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-status">
            <span className="status-dot" />
            <span>System Online</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
