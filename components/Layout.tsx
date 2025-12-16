import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Building2, MapPin, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../services/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Reports', path: '/reports', icon: FileText },
    // Admin Only Routes
    ...(isAdmin ? [
      { label: 'Manage Cities', path: '/admin/cities', icon: MapPin },
      { label: 'Manage Kendras', path: '/admin/kendras', icon: Building2 },
      { label: 'Manage Users', path: '/admin/users', icon: Users },
    ] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-indigo-700 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <h1 className="font-bold text-lg">Yuva Kendra</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-indigo-800 text-white transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold hidden md:block mb-1">Yuva Kendra</h1>
          <p className="text-indigo-300 text-xs hidden md:block mb-8">Reporting System</p>
          
          <div className="flex items-center space-x-3 mb-8 p-3 bg-indigo-900 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-lg font-bold">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{user?.name}</p>
              <p className="text-indigo-300 text-xs uppercase">{user?.role}</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-900/20 hover:text-red-100 mt-8 transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Overlay for mobile menu */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;