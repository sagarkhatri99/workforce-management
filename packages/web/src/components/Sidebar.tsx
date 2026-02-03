import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Clock, DollarSign, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar() {
  const { user, logout } = useAuth();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/shifts', label: 'Shifts', icon: Calendar },
  ];

  if (user?.role === 'WORKER') {
    links.push({ to: '/my-shifts', label: 'My Shifts', icon: Clock });
  }

  if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      links.push({ to: '/payroll', label: 'Payroll', icon: DollarSign });
  }

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-800">
        Workforce
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
              }`
            }
          >
            <link.icon size={20} />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="mb-4 text-sm text-gray-400">
            {user?.name} ({user?.role})
        </div>
        <button
            onClick={logout}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 w-full"
        >
            <LogOut size={20} />
            Logout
        </button>
      </div>
    </div>
  );
}
