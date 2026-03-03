
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRoles } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Team Members', path: '/team' },
    { name: 'Clubs', path: '/clubs' },
    { name: 'Activities', path: '/activities' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Achievements', path: '/achievements' },
    { name: 'Career', path: '/career' },
    { name: 'Games', path: '/games' },
    { name: 'Community Chat', path: '/community-chat' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-maroon-800 rounded-md flex items-center justify-center text-white font-bold text-xl">T</div>
              <span className="text-xl font-bold text-maroon-800 tracking-tight hidden md:block">TITAN CLUB</span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(link.path) ? 'text-maroon-800 bg-maroon-50' : 'text-gray-600 hover:text-maroon-800 hover:bg-gray-50'}`}
              >
                {link.name}
              </Link>
            ))}
            {user?.role === UserRoles.SUPER_ADMIN && (
              <Link to="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-maroon-800 bg-maroon-50' : 'text-gray-600 hover:text-maroon-800 hover:bg-gray-50'}`}>
                Oversight
              </Link>
            )}

            {/* Profile avatar only — login/logout is on profile page */}
            <Link
              to="/profile"
              className="ml-4 w-9 h-9 bg-maroon-800 rounded-full flex items-center justify-center text-white font-black text-xs hover:bg-maroon-900 transition-colors shadow"
              title={user ? user.name : 'Login'}
            >
              {user ? user.name?.charAt(0)?.toUpperCase() : '?'}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            {/* Mobile profile icon */}
            <Link
              to="/profile"
              className="w-8 h-8 bg-maroon-800 rounded-full flex items-center justify-center text-white font-black text-xs hover:bg-maroon-900 transition-colors"
            >
              {user ? user.name?.charAt(0)?.toUpperCase() : '?'}
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-maroon-800 hover:bg-gray-100 focus:outline-none">
              <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 absolute top-16 left-0 right-0 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.path) ? 'text-maroon-800 bg-maroon-50' : 'text-gray-600 hover:text-maroon-800 hover:bg-gray-50'}`}>
                {link.name}
              </Link>
            ))}
            {user?.role === UserRoles.SUPER_ADMIN && (
              <Link to="/dashboard" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard') ? 'text-maroon-800 bg-maroon-50' : 'text-gray-600 hover:text-maroon-800 hover:bg-gray-50'}`}>
                Oversight
              </Link>
            )}
            <Link to="/profile" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/profile') ? 'text-maroon-800 bg-maroon-50' : 'text-gray-600 hover:text-maroon-800 hover:bg-gray-50'}`}>
              {user ? 'My Profile' : 'Login / Profile'}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
