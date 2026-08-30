import React, { useState, useEffect, useRef } from 'react';
import { JournalSession, JournalMessage, JournalSummary, UserProfile } from '../types';
import {
  saveJournalSession,
  deleteJournalSession,
} from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Sliders,
  Clock,
  Search,
  Loader2,
  Shield,
  Lightbulb,
  Compass,
  HeartHandshake,
  Workflow,
} from 'lucide-react';

interface JournalViewProps {
  user: UserProfile | null;
  sessions: JournalSession[];
  onRequireAuth: () => void;
}

const JOURNAL_STARTERS = [
  {
    title: 'Civic & Career Crossroads',
    prompt: 'I have to decide between staying at my current role or applying for a government civic technology fellowship. Help me weigh the trade-offs.',
    icon: Compass,
  },
  {
    title: 'Navigating Institutional Resistance',
    prompt: 'I am struggling with endless red tape trying to get grant funding approved for our community project. How can I stay resilient and structure my next moves?',
    icon: Workflow,
  },
  {
    title: 'Unpacking Daily Ambiguity',
    prompt: 'I am feeling overwhelmed by all the conflicting requirements and paperwork on my desk this week. Can we do a structured 3-step brain dump?',
    icon: Lightbulb,
  },
  {
    title: 'Mindful Boundary Setting',
    prompt: 'I find it hard to say no to requests from municipal committee members. How can I communicate firm boundaries respectfully?',
    icon: HeartHandshake,
  },
];

export const JournalView: React.FC<JournalViewProps> = ({
  user,
  sessions,
  onRequireAuth,
}) => {
  const [activeSession, setActiveSession] = useState<JournalSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'balanced' | 'mindful' | 'analytical' | 'creative'>('balanced');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isGenerating]);

  // If no active session, pick the first or create a blank one
  useEffect(() => {
    if (!activeSession && sessions.length > 0) {
      setActiveSession(sessions[0]);
    } else if (!activeSession && sessions.length === 0 && user) {
      createNewSession();
    }
  }, [sessions, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const createNewSession = () => {
    if (!user) {
      onRequireAuth();
      return;
    }

    const newSess: JournalSession = {
      id: `journal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.uid,
      title: 'New Reflective Journal Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: `msg_welcome_${Date.now()}`,
          role: 'assistant',
          content: `Welcome to your **Personal Gemini Journal**. \n\nI am your private, multi-turn AI reflection companion. Everything you discuss here is stored securely in your isolated Firestore database partition. What is on your mind today?`,
          timestamp: Date.now(),
        },
      ],
    };

    setActiveSession(newSess);
    saveJournalSession(newSess).catch(console.error);
    showToast('New private journal session created.');
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isGenerating) return;

    if (!user) {
      onRequireAuth();
      return;
    }

    let current = activeSession;
    if (!current) {
      current = {
        id: `journal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user.uid,
        title: textToSend.slice(0, 30) + '...',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
    }

    const userMsg: JournalMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...current.messages, userMsg];
    const updatedSession: JournalSession = {
      ...current,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    setActiveSession(updatedSession);
    setInputText('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/journal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          tone: selectedTone,
          sessionTopic: sessionTopic || current.title,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to get journal response');
      }

      const data = await response.json();
      const assistantMsg: JournalMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      };

      const finalSession: JournalSession = {
        ...updatedSession,
        messages: [...updatedMessages, assistantMsg],
        updatedAt: Date.now(),
      };

      if (finalSession.title === 'New Reflective Journal Session' && userMsg.content.length > 5) {
        finalSession.title = userMsg.content.slice(0, 35) + (userMsg.content.length > 35 ? '...' : '');
      }

      setActiveSession(finalSession);
      await saveJournalSession(finalSession);

      // Auto-summarize if this session has reached 4+ messages and hasn't been summarized yet
      if (!finalSession.summary && finalSession.messages.length >= 4) {
        triggerAutoSummary(finalSession);
      }
    } catch (err: any) {
      console.error('Error generating journal reply:', err);
      const errMsg: JournalMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Unable to generate response**: ${err?.message || 'Server error. Please ensure the GEMINI_API_KEY is configured.'}`,
        timestamp: Date.now(),
      };
      setActiveSession({
        ...updatedSession,
        messages: [...updatedMessages, errMsg],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerAutoSummary = async (sessionToSummarize: JournalSession) => {
    if (!user || sessionToSummarize.messages.length < 2) return;
    try {
      const response = await fetch('/api/journal/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: sessionToSummarize.messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.summary) {
          const updated: JournalSession = {
            ...sessionToSummarize,
            title: data.summary.title || sessionToSummarize.title,
            summary: data.summary,
            updatedAt: Date.now(),
          };
          setActiveSession((prev) => (prev?.id === updated.id ? updated : prev));
          await saveJournalSession(updated);
        }
      }
    } catch (err) {
      console.warn('Background auto-summary skipped:', err);
    }
  };

  const handleGenerateSummary = async () => {
    if (!activeSession || activeSession.messages.length < 2) {
      showToast('Engage in at least one reflection turn before generating a summary.');
      return;
    }
    if (!user) {
      onRequireAuth();
      return;
    }

    setIsSummarizing(true);
    try {
      const response = await fetch('/api/journal/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: activeSession.messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to summarize session');
      }

      const data = await response.json();
      const summary: JournalSummary = data.summary;

      const updated: JournalSession = {
        ...activeSession,
        title: summary.title || activeSession.title,
        summary,
        updatedAt: Date.now(),
      };

      setActiveSession(updated);
      await saveJournalSession(updated);
      showToast('Reflection summary synthesized and saved to your private Firestore!');
    } catch (err: any) {
      console.error('Summary error:', err);
      showToast('Failed to generate summary. Please retry.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm('Are you sure you want to delete this journal session?')) {
      await deleteJournalSession(user.uid, sessionId);
      if (activeSession?.id === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setActiveSession(remaining[0] || null);
      }
      showToast('Session deleted.');
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary?.conciseSummary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-blue-500/40 text-white text-xs font-semibold shadow-xl shadow-slate-900/40 flex items-center gap-2 animate-slide-up">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Journal Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Session List & Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Journal Management</h2>
            <button
              type="button"
              id="journal-new-session-btn"
              onClick={createNewSession}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          </div>

          {/* Tone Selector */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Perspective Tone:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(
                [
                  { id: 'balanced', label: 'Balanced Advisor' },
                  { id: 'mindful', label: 'Mindful Empath' },
                  { id: 'analytical', label: 'Structured Analysis' },
                  { id: 'creative', label: 'Creative Divergent' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  id={`tone-select-${t.id}`}
                  onClick={() => setSelectedTone(t.id)}
                  className={`p-2 rounded-lg text-left font-medium transition-colors cursor-pointer text-xs ${
                    selectedTone === t.id
                      ? 'bg-blue-50 border border-blue-200 text-blue-800 font-semibold'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Past Sessions List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Session History ({sessions.length})
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="search-journal-sessions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reflections..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {filteredSessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  {sessions.length === 0 ? 'No journal sessions yet. Start your first reflection above!' : 'No matching sessions found.'}
                </div>
              ) : (
                filteredSessions.map((sess) => {
                  const isActive = activeSession?.id === sess.id;
                  return (
                    <div
                      key={sess.id}
                      id={`session-item-${sess.id}`}
                      onClick={() => setActiveSession(sess)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-start justify-between gap-2 group ${
                        isActive
                          ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                          : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-semibold truncate text-slate-900">{sess.title}</h4>
                          {sess.summary && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Summarized" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                          {sess.summary?.conciseSummary || sess.messages[sess.messages.length - 1]?.content || 'Empty session'}
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">
                          {new Date(sess.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {sess.messages.length} messages
                        </span>
                      </div>

                      <button
                        type="button"
                        id={`delete-session-${sess.id}`}
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity rounded cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Inquiry Starters */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Inquiry Starter Prompts:
            </span>
            <div className="space-y-1.5">
              {JOURNAL_STARTERS.map((st, i) => {
                const Icon = st.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    id={`journal-starter-${i}`}
                    onClick={() => handleSendMessage(st.prompt)}
                    disabled={isGenerating}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 group-hover:text-blue-700">
                      <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{st.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{st.prompt}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Area: Conversation & Generated Summary */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Reflection</h2>
            <button
              type="button"
              id="generate-summary-btn"
              onClick={handleGenerateSummary}
              disabled={isSummarizing || !activeSession || activeSession.messages.length < 2}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Synthesize Reflection</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
            {/* Session Top Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  id="active-session-title-input"
                  value={activeSession?.title || 'Journal Reflection'}
                  onChange={(e) => {
                    if (activeSession) {
                      const updated = { ...activeSession, title: e.target.value };
                      setActiveSession(updated);
                      saveJournalSession(updated);
                    }
                  }}
                  className="bg-transparent font-bold text-sm sm:text-base text-slate-900 focus:outline-none focus:border-b border-blue-500 w-full truncate"
                  placeholder="Name this journal session..."
                />
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  Private Firestore session · Multi-turn Gemini 2.5
                </span>
              </div>
            </div>

            {/* Generated Summary Card (If Present) */}
            {activeSession?.summary && (
              <div className="p-4 bg-blue-50/70 border-b border-blue-100 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Journal Reflection Synthesis
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-700 border border-blue-200">
                    Mood: {activeSession.summary.reflectionMood}
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed italic">{activeSession.summary.conciseSummary}</p>

                {/* Key Takeaways */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-blue-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Key Realizations
                    </span>
                    <ul className="space-y-1 text-slate-700 text-[11px]">
                      {activeSession.summary.keyTakeaways.map((t, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-blue-600">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-blue-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Forward Inquiries
                    </span>
                    <ul className="space-y-1 text-slate-700 text-[11px]">
                      {activeSession.summary.actionableQuestions.map((q, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-emerald-600">?</span>
                          <span className="italic">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {activeSession?.messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    id={`chat-msg-${msg.id}`}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[10px] font-semibold opacity-75">
                        <span>{isUser ? 'You (Reflector)' : 'CivicLens AI Journal Companion'}</span>
                        <span>·</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="prose prose-slate max-w-none text-xs sm:text-sm">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isGenerating && (
                <div className="flex justify-start">
                  <div className="rounded-2xl p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-bl-none flex items-center space-x-2 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Gemini is formulating thoughtful reflections...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3.5 border-t border-slate-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  id="journal-input-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder="Reflect, brainstorm, or explore what is on your mind... (Shift+Enter for newline)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                />

                <button
                  type="submit"
                  id="journal-send-btn"
                  disabled={!inputText.trim() || isGenerating}
                  className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  title="Send reflection"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
