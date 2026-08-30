import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  FileSearch,
  BookOpen,
  BookmarkCheck,
  ShieldCheck,
  LogOut,
  User,
  Sparkles,
  Layers,
  Menu,
  X,
  ChevronRight,
  Shield,
} from 'lucide-react';

export type AppTab = 'journal' | 'decoder' | 'saved';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenSecurity: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  onSignOut,
  onOpenSecurity,
  savedCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden sticky top-0 z-40 w-full bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">CivicLens</span>
        </div>

        <div className="flex items-center space-x-2">
          {user ? (
            <button
              type="button"
              id="mobile-user-profile-btn"
              onClick={onOpenSecurity}
              className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase"
            >
              {user.displayName?.charAt(0) || 'U'}
            </button>
          ) : (
            <button
              type="button"
              id="mobile-sign-in-btn"
              onClick={onOpenAuth}
              className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-md font-semibold"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 text-white border-b border-slate-800 px-4 py-3 space-y-2 animate-fade-in">
          <div className="text-xs font-bold text-slate-500 uppercase px-2 py-1">Dashboard Menu</div>
          <button
            type="button"
            id="mobile-nav-tab-decoder"
            onClick={() => {
              onSelectTab('decoder');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
              currentTab === 'decoder' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Bureaucracy Decoder</span>
            </div>
            <span className="text-[10px] uppercase font-bold bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded">Active</span>
          </button>

          <button
            type="button"
            id="mobile-nav-tab-journal"
            onClick={() => {
              onSelectTab('journal');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${
              currentTab === 'journal' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>Personal Journal</span>
          </button>

          <button
            type="button"
            id="mobile-nav-tab-saved"
            onClick={() => {
              onSelectTab('saved');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
              currentTab === 'saved' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Saved Analyses</span>
            </div>
            {savedCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                {savedCount}
              </span>
            )}
          </button>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              id="mobile-security-btn"
              onClick={() => {
                onOpenSecurity();
                setMobileMenuOpen(false);
              }}
              className="text-xs text-emerald-400 flex items-center space-x-1.5 py-1"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Isolated Architecture</span>
            </button>

            {user && (
              <button
                type="button"
                id="mobile-sign-out-btn"
                onClick={() => {
                  onSignOut();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center space-x-1 py-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Professional Polish Theme) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col shrink-0 border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block leading-tight">CivicLens</span>
            <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider block">AI Bureaucracy Layer</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1.5">
          <div className="text-xs font-bold text-slate-500 uppercase px-3 mb-2 tracking-wider">Dashboard</div>

          <button
            type="button"
            id="nav-tab-decoder"
            onClick={() => onSelectTab('decoder')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
              currentTab === 'decoder'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className={`w-5 h-5 ${currentTab === 'decoder' ? 'text-blue-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Decoder</span>
            </div>
            {currentTab === 'decoder' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            )}
          </button>

          <button
            type="button"
            id="nav-tab-journal"
            onClick={() => onSelectTab('journal')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
              currentTab === 'journal'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className={`w-5 h-5 ${currentTab === 'journal' ? 'text-blue-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>AI Journal</span>
            </div>
            {currentTab === 'journal' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            )}
          </button>

          <button
            type="button"
            id="nav-tab-saved"
            onClick={() => onSelectTab('saved')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-left ${
              currentTab === 'saved'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <svg className={`w-5 h-5 ${currentTab === 'saved' ? 'text-blue-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Saved Archive</span>
            </div>
            {savedCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Security Quick Link */}
        <div className="px-4 py-2">
          <button
            type="button"
            id="sidebar-security-badge-btn"
            onClick={onOpenSecurity}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/90 border border-slate-800 text-emerald-400 text-xs font-medium transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <div className="text-left truncate">
              <span className="block font-semibold">User Silo Verified</span>
              <span className="text-[10px] text-slate-400 block truncate">Multi-Tenant Firestore</span>
            </div>
          </button>
        </div>

        {/* Bottom Profile Footer */}
        <div className="p-4 border-t border-slate-800">
          {user ? (
            <div className="flex items-center justify-between space-x-3 px-2 py-1">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0 overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    user.displayName?.charAt(0) || 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0 text-xs text-slate-400">
                  <p className="truncate font-semibold text-white">{user.displayName || 'Demo User'}</p>
                  <p className="truncate text-[11px] text-slate-400">
                    {user.isAnonymous ? 'Guest Tier' : 'Personal Verified'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="nav-sign-out-btn"
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="nav-sign-in-btn"
              onClick={onOpenAuth}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Demo</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
