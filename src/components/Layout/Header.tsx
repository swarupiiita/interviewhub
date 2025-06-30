import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Code, LogOut, Plus, User, Sparkles } from 'lucide-react';
import AIInterviewPrep from '../AI/AIInterviewPrep';

const Header: React.FC = () => {
  const { user, signOut, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAI, setShowAI] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinkClass = (path: string) => 
    `transition-colors ${
      isActive(path) 
        ? 'text-blue-600 font-semibold border-b-2 border-blue-600 pb-1' 
        : 'text-gray-700 hover:text-blue-600'
    }`;

  const isGuest = user?.email === 'guest@iiita.ac.in' || localStorage.getItem('guest_mode') === 'true';

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Code className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">InterviewHub</span>
              <span className="text-sm text-gray-500">IIITA</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className={navLinkClass('/leaderboard')}>
                Leaderboard
              </Link>
              <Link to="/" className={navLinkClass('/')}>
                Experiences
              </Link>
              <Link to="/companies" className={navLinkClass('/companies')}>
                Companies
              </Link>
              <Link to="/questions" className={navLinkClass('/questions')}>
                Questions
              </Link>
              <button
                onClick={() => setShowAI(true)}
                className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Prep</span>
              </button>
              {user && (
                <Link to="/share" className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>Share Experience</span>
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <Link to="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <User className="w-5 h-5" />
                    <span className="hidden sm:block">
                      {isGuest ? (
                        <span className="flex items-center space-x-1">
                          <span>Guest</span>
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Guest Mode
                          </span>
                        </span>
                      ) : (
                        user.full_name
                      )}
                    </span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:block">
                      {isGuest ? 'Switch Account' : 'Sign Out'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowAI(true)}
              className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Interview Prep</span>
            </button>
          </div>
        </div>
      </header>

      {/* AI Interview Prep Modal */}
      <AIInterviewPrep 
        isOpen={showAI} 
        onClose={() => setShowAI(false)} 
      />
    </>
  );
};

export default Header;