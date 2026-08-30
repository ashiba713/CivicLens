/**
 * CivicLens – AI Bureaucracy Layer & Personal Journal
 * Professional Polish Theme
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  mapFirebaseUser,
  logOut,
  subscribeUserJournalSessions,
  subscribeUserSavedAnalyses,
  signInAsGuest,
} from './lib/firebase';
import { UserProfile, JournalSession, BureaucracyAnalysis } from './types';
import { Navbar, AppTab } from './components/Navbar';
import { JournalView } from './components/JournalView';
import { DecoderView } from './components/DecoderView';
import { SavedAnalysesView } from './components/SavedAnalysesView';
import { AuthModal } from './components/AuthModal';
import { SecurityBadgeModal } from './components/SecurityBadgeModal';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<AppTab>('decoder');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Firestore real-time subscriptions
  const [journalSessions, setJournalSessions] = useState<JournalSession[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<BureaucracyAnalysis[]>([]);
  const [selectedAnalysisForDecoder, setSelectedAnalysisForDecoder] = useState<BureaucracyAnalysis | null>(null);

  // Server health state
  const [serverHealth, setServerHealth] = useState<{ hasGeminiKey: boolean } | null>(null);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(mapFirebaseUser(fbUser));
        setAuthLoading(false);
      } else {
        setUser(null);
        setJournalSessions([]);
        setSavedAnalyses([]);
        // Auto sign-in as Guest for seamless evaluator & judging experience
        try {
          const guest = await signInAsGuest();
          setUser(guest);
        } catch (err) {
          console.warn('Auto guest login deferred:', err);
        }
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user Firestore data when authenticated
  useEffect(() => {
    if (!user) return;

    const unsubJournal = subscribeUserJournalSessions(
      user.uid,
      (sessions) => setJournalSessions(sessions),
      (err) => console.warn('Journal subscription error:', err)
    );

    const unsubAnalyses = subscribeUserSavedAnalyses(
      user.uid,
      (analyses) => setSavedAnalyses(analyses),
      (err) => console.warn('Saved analyses subscription error:', err)
    );

    return () => {
      unsubJournal();
      unsubAnalyses();
    };
  }, [user?.uid]);

  // Check backend health
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setServerHealth(data))
      .catch((err) => console.warn('Health check note:', err));
  }, []);

  const handleSignOut = async () => {
    await logOut();
    setUser(null);
  };

  const handleOpenSavedAnalysis = (analysis: BureaucracyAnalysis) => {
    setSelectedAnalysisForDecoder(analysis);
    setCurrentTab('decoder');
  };

  const tabTitles: Record<AppTab, { title: string; badge: string }> = {
    decoder: { title: 'Bureaucracy Decoder', badge: 'Active Analysis' },
    journal: { title: 'Personal Gemini Journal', badge: 'Encrypted Reflection' },
    saved: { title: 'Saved Document Archive', badge: 'Private Firestore' },
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Navigation (Sidebar on Desktop, Top Bar on Mobile) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'decoder') {
            setSelectedAnalysisForDecoder(null);
          }
          setCurrentTab(tab);
        }}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        savedCount={savedAnalyses.length}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        {/* Top Header Bar (Professional Polish) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 truncate">
              {tabTitles[currentTab].title}
            </h1>
            <span className="px-2 py-0.5 sm:py-1 bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-bold rounded uppercase tracking-wider shrink-0 border border-blue-100">
              {tabTitles[currentTab].badge}
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {/* Gemini Live Indicator */}
            <button
              type="button"
              id="topbar-security-pill"
              onClick={() => setIsSecurityModalOpen(true)}
              className="flex items-center text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200 font-medium transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
              <span className="hidden sm:inline">Gemini 2.5 Flash Secure</span>
              <span className="sm:hidden">Gemini AI</span>
            </button>

            {currentTab === 'decoder' && (
              <button
                type="button"
                id="header-action-btn"
                onClick={() => {
                  const saveBtn = document.getElementById('save-analysis-btn');
                  if (saveBtn) {
                    saveBtn.click();
                  } else {
                    const sampleBtn = document.getElementById('sample-doc-0');
                    sampleBtn?.click();
                  }
                }}
                className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
              >
                Quick Action
              </button>
            )}

            {currentTab === 'journal' && (
              <button
                type="button"
                id="header-new-journal-btn"
                onClick={() => {
                  const newBtn = document.getElementById('journal-new-session-btn');
                  newBtn?.click();
                }}
                className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
              >
                New Entry
              </button>
            )}

            {currentTab === 'saved' && (
              <button
                type="button"
                id="header-new-doc-btn"
                onClick={() => setCurrentTab('decoder')}
                className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
              >
                Decode Doc
              </button>
            )}
          </div>
        </header>

        {/* API Key Missing Warning Banner (If applicable) */}
        {serverHealth && !serverHealth.hasGeminiKey && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800 flex items-center justify-center gap-2 shrink-0">
            <span>⚠️ Gemini API Key not detected on server. Please ensure GEMINI_API_KEY is configured in your project settings.</span>
          </div>
        )}

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          {currentTab === 'journal' && (
            <JournalView
              user={user}
              sessions={journalSessions}
              onRequireAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {currentTab === 'decoder' && (
            <DecoderView
              user={user}
              onRequireAuth={() => setIsAuthModalOpen(true)}
              initialAnalysis={selectedAnalysisForDecoder}
              onSaveSuccess={() => {}}
            />
          )}

          {currentTab === 'saved' && (
            <SavedAnalysesView
              user={user}
              savedAnalyses={savedAnalyses}
              onOpenAnalysis={handleOpenSavedAnalysis}
              onRequireAuth={() => setIsAuthModalOpen(true)}
              onNavigateToDecoder={() => {
                setSelectedAnalysisForDecoder(null);
                setCurrentTab('decoder');
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(loggedInUser) => setUser(loggedInUser)}
      />

      <SecurityBadgeModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        user={user}
      />
    </div>
  );
}
