import React, { useState, useEffect } from 'react';
import {
  BureaucracyAnalysis,
  ChecklistItem,
  ConfusionItem,
  InstitutionCategory,
  UserProfile,
  FollowupMessage,
} from '../types';
import { SAMPLE_DOCUMENTS, SampleDoc } from '../data/sampleDocuments';
import { EpistemicBadge } from './EpistemicBadge';
import { ConfusionDetectorCard } from './ConfusionDetectorCard';
import { saveBureaucracyAnalysis } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import {
  FileSearch,
  Sparkles,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  ListOrdered,
  CheckSquare,
  Building2,
  Bookmark,
  Check,
  Send,
  MessageSquare,
  Printer,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Info,
} from 'lucide-react';

interface DecoderViewProps {
  user: UserProfile | null;
  onRequireAuth: () => void;
  initialAnalysis?: BureaucracyAnalysis | null;
  onSaveSuccess?: () => void;
}

const CATEGORIES: InstitutionCategory[] = [
  'Government Benefit & Program',
  'University & Academic Fellowship',
  'Immigration & Visa Status',
  'Housing & Municipal Assistance',
  'Small Business & Grant',
  'Healthcare & Insurance',
  'Legal & Regulatory',
  'General Bureaucracy',
];

export const DecoderView: React.FC<DecoderViewProps> = ({
  user,
  onRequireAuth,
  initialAnalysis,
  onSaveSuccess,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InstitutionCategory>('General Bureaucracy');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<BureaucracyAnalysis | null>(initialAnalysis || null);
  const [activeTab, setActiveTab] = useState<'overview' | 'confusion' | 'documents' | 'deadlines' | 'steps' | 'checklist' | 'qa'>('overview');
  
  // Follow up Q&A state
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [followupHistory, setFollowupHistory] = useState<FollowupMessage[]>([]);
  const [isAskingFollowup, setIsAskingFollowup] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync if initialAnalysis changes from parent
  useEffect(() => {
    if (initialAnalysis) {
      setAnalysis(initialAnalysis);
      setInputText(initialAnalysis.sourceTextFull || initialAnalysis.sourceTextSnippet || '');
      setSelectedCategory(initialAnalysis.category);
    }
  }, [initialAnalysis]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectSample = (sample: SampleDoc) => {
    setInputText(sample.text);
    setSelectedCategory(sample.category as InstitutionCategory);
    showToast(`Loaded sample: ${sample.title}`);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || inputText.trim().length < 20) {
      showToast('Please paste a bureaucratic document (at least 20 characters) to decode.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setFollowupHistory([]);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/decoder/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          category: selectedCategory,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to decode text');
      }

      const data = await response.json();
      const rawAnalysis = data.analysis;

      const fullAnalysis: BureaucracyAnalysis = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: user?.uid || 'anonymous',
        title: rawAnalysis.title || 'Decoded Bureaucratic Document',
        category: selectedCategory,
        sourceTextSnippet: inputText.slice(0, 300) + (inputText.length > 300 ? '...' : ''),
        sourceTextFull: inputText,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        plainLanguageSummary: rawAnalysis.plainLanguageSummary,
        whatToDoNextImmediate: rawAnalysis.whatToDoNextImmediate || [],
        confusionItems: rawAnalysis.confusionItems || [],
        documents: rawAnalysis.documents || [],
        eligibility: rawAnalysis.eligibility || [],
        deadlines: rawAnalysis.deadlines || [],
        fees: rawAnalysis.fees || [],
        steps: rawAnalysis.steps || [],
        authority: rawAnalysis.authority || {
          name: 'Not specified',
          department: 'Not specified',
          contactChannels: [],
          source: 'missing',
        },
        checklist: (rawAnalysis.checklist || []).map((item: any, i: number) => ({
          id: item.id || `check_${i}`,
          label: item.label,
          category: item.category || 'Other',
          completed: false,
          notes: item.notes,
        })),
        disclaimer: rawAnalysis.disclaimer || 'CivicLens clarifies supplied text and does not replace official legal or institutional counsel.',
        isSaved: false,
      };

      setAnalysis(fullAnalysis);
      setActiveTab('overview');
      showToast('Document successfully decoded with Confusion Detection!');
    } catch (err: any) {
      console.error('Analysis error:', err);
      showToast(`Decoding failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!analysis) return;
    const updated = analysis.checklist.map((item) => {
      if (item.id === itemId) {
        const nextState = !item.completed;
        if (nextState) {
          try {
            confetti({
              particleCount: 25,
              spread: 45,
              origin: { y: 0.8 },
            });
          } catch (e) {}
        }
        return { ...item, completed: nextState };
      }
      return item;
    });

    const updatedAnalysis = { ...analysis, checklist: updated, updatedAt: Date.now() };
    setAnalysis(updatedAnalysis);

    if (user && updatedAnalysis.isSaved) {
      saveBureaucracyAnalysis(updatedAnalysis).catch(console.error);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysis) return;
    if (!user) {
      onRequireAuth();
      return;
    }

    setIsSaving(true);
    try {
      const toSave = {
        ...analysis,
        userId: user.uid,
        isSaved: true,
        updatedAt: Date.now(),
      };
      await saveBureaucracyAnalysis(toSave);
      setAnalysis(toSave);
      setSavedSuccess(true);
      showToast('Saved to your private Firestore archive!');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      console.error('Save error:', err);
      showToast('Failed to save analysis. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAskFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupQuestion.trim() || isAskingFollowup || !analysis) return;

    const userQ: FollowupMessage = {
      id: `fq_${Date.now()}`,
      role: 'user',
      content: followupQuestion.trim(),
      timestamp: Date.now(),
    };

    setFollowupHistory((prev) => [...prev, userQ]);
    setFollowupQuestion('');
    setIsAskingFollowup(true);

    try {
      const response = await fetch('/api/decoder/ask-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: analysis.sourceTextFull,
          analysisSummary: analysis.plainLanguageSummary,
          question: userQ.content,
          history: followupHistory.map((h) => ({ role: h.role, content: h.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();
      const aiMsg: FollowupMessage = {
        id: `fa_${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: Date.now(),
      };

      setFollowupHistory((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Follow-up error:', err);
      const errMsg: FollowupMessage = {
        id: `fe_${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Unable to answer follow-up question. Please ensure GEMINI_API_KEY is configured.',
        timestamp: Date.now(),
      };
      setFollowupHistory((prev) => [...prev, errMsg]);
    } finally {
      setIsAskingFollowup(false);
    }
  };

  const completedChecklistCount = analysis?.checklist.filter((c) => c.completed).length || 0;
  const totalChecklistCount = analysis?.checklist.length || 0;
  const checklistPercent = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-blue-500/40 text-white text-xs font-semibold shadow-xl shadow-slate-900/40 flex items-center gap-2 animate-slide-up">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Visual Workflow Stepper Banner (Professional Polish) */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <FileSearch className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-800">Bureaucracy Decoder Workflow</h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Confusion Detector Enabled
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">Transforming complex administrative directives into clear action plans</span>
        </div>

        {/* 5-Step Visual Path */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {[
            { num: '1', step: 'PASTE DOCUMENT', active: !analysis && !isAnalyzing },
            { num: '2', step: 'ANALYZE', active: isAnalyzing },
            { num: '3', step: 'UNDERSTAND', active: !!analysis && activeTab === 'overview' },
            { num: '4', step: 'CHECKLIST', active: !!analysis && activeTab === 'checklist' },
            { num: '5', step: 'SAVE & CLARIFY', active: !!analysis && (savedSuccess || activeTab === 'qa') },
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border flex items-center gap-2 font-medium transition-colors ${
                s.active
                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                s.active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {s.num}
              </span>
              <span className="tracking-wide text-[11px] truncate">{s.step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout (Source Input / Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Source Document Card */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Source Document</h2>
            {inputText && (
              <button
                type="button"
                id="clear-input-btn"
                onClick={() => {
                  setInputText('');
                  setAnalysis(null);
                }}
                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Clear Text
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col space-y-4">
            {/* Sample Selector Quick Bar */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Load Sample Institutional Text:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {SAMPLE_DOCUMENTS.map((doc, idx) => (
                  <button
                    key={doc.id}
                    type="button"
                    id={`sample-doc-${idx}`}
                    onClick={() => handleSelectSample(doc)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors font-medium cursor-pointer"
                    title={doc.description}
                  >
                    {doc.title.split(' ')[1] || doc.title.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 flex flex-col space-y-1 relative">
              <textarea
                id="decoder-source-textarea"
                rows={9}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste institutional instructions, policy clauses, grant requirements, or letters here..."
                className="w-full flex-1 resize-y bg-slate-50/50 border border-slate-200 rounded-lg p-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed font-mono"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{inputText.length} characters</span>
                <span className="italic">Paste complete clauses for highest accuracy</span>
              </div>
            </div>

            {/* Category Select */}
            <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Category:</label>
              <select
                id="decoder-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as InstitutionCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Decode Action Button */}
            <button
              type="button"
              id="decode-submit-btn"
              onClick={handleAnalyze}
              disabled={isAnalyzing || inputText.trim().length < 20}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Decoding Document Clauses with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Decode & Detect Confusions</span>
                </>
              )}
            </button>

            {/* Document Context Info */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start space-x-3 text-xs text-blue-900">
              <div className="text-blue-600 mt-0.5 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <p className="leading-snug">
                CivicLens highlights vague deadlines, ambiguous conditions, and missing forms before you submit paperwork.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Decoded Breakdown & Tabs */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {analysis ? 'Analysis Results' : 'Awaiting Document'}
            </h2>
            {analysis && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="save-analysis-btn"
                  onClick={handleSaveAnalysis}
                  disabled={isSaving}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                    savedSuccess || analysis.isSaved
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  {savedSuccess || analysis.isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Saved in Archive</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save Analysis</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="print-analysis-btn"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  title="Print / Save PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {!analysis ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[380px]">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Document Decoded Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Paste any administrative letter, grant description, or scholarship requirement on the left, or select a demo sample to generate a full breakdown.
              </p>
              <button
                type="button"
                onClick={() => handleSelectSample(SAMPLE_DOCUMENTS[0])}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                Load Sample Disaster Assistance Letter →
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              {/* Top Card Header */}
              <div className="p-5 border-b border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {analysis.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{analysis.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <EpistemicBadge source="explicit" size="sm" />
                  </div>
                </div>

                {/* What To Do Next Immediate Steps */}
                {analysis.whatToDoNextImmediate && analysis.whatToDoNextImmediate.length > 0 && (
                  <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                      Immediate Next Actions:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {analysis.whatToDoNextImmediate.map((action, i) => (
                        <div key={i} className="p-2.5 rounded-md bg-white border border-blue-100 text-slate-800 flex items-start gap-2 shadow-2xs">
                          <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {i + 1}
                          </span>
                          <span className="text-[11px] leading-snug">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Tabs Nav */}
              <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Decoded Plan', icon: FileText },
                  {
                    id: 'confusion',
                    label: `Confusion Alert (${analysis.confusionItems.length})`,
                    icon: AlertTriangle,
                    highlight: analysis.confusionItems.length > 0,
                  },
                  { id: 'checklist', label: `Checklist (${completedChecklistCount}/${totalChecklistCount})`, icon: CheckSquare },
                  { id: 'documents', label: `Documents (${analysis.documents.length})`, icon: FileSearch },
                  { id: 'deadlines', label: 'Dates & Authority', icon: Calendar },
                  { id: 'qa', label: 'Clarification Q&A', icon: MessageSquare },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      id={`subtab-${tab.id}`}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
                        isActive
                          ? 'border-blue-600 text-blue-600 bg-white'
                          : tab.highlight
                          ? 'border-transparent text-amber-800 hover:text-amber-900 hover:bg-amber-50/40'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Body */}
              <div className="p-6 space-y-6">
                {/* 1. Overview Plan */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Plain-Language Executive Translation
                      </h4>
                      <div className="text-slate-700 text-sm leading-relaxed space-y-3 prose prose-slate max-w-none">
                        <ReactMarkdown>{analysis.plainLanguageSummary}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Quick Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Primary Authority
                        </div>
                        <div className="text-base font-bold text-slate-900 truncate">
                          {analysis.authority.name || 'Administrative Office'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {analysis.authority.department || 'Official Review Division'}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">
                          Action Items
                        </div>
                        <div className="text-base font-bold text-blue-600">
                          {analysis.steps.length} Key Process Steps
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {analysis.documents.length} forms & evidence items required
                        </div>
                      </div>
                    </div>

                    {/* Chronological Steps */}
                    {analysis.steps.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Sequential Action Roadmap
                        </h4>
                        <div className="space-y-2.5">
                          {analysis.steps.map((step) => (
                            <div
                              key={step.stepNumber}
                              className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs"
                            >
                              <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                                {step.stepNumber}
                              </span>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="font-bold text-slate-900 text-xs">{step.title}</h5>
                                  <EpistemicBadge source={step.source} size="sm" />
                                </div>
                                <p className="text-slate-700 leading-relaxed">{step.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Confusion Detector */}
                {activeTab === 'confusion' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                      <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm mb-1">
                        <AlertTriangle className="w-5 h-5 text-amber-700" />
                        <span>Confusion Detector: Proactive Red Tape Alert</span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        We identified <strong>{analysis.confusionItems.length} specific ambiguities or missing specifications</strong> in this text. Inquiring on these early prevents silent disqualification or lost appeals.
                      </p>
                    </div>

                    {analysis.confusionItems.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs border border-slate-200 rounded-xl">
                        No critical ambiguities detected in this text.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysis.confusionItems.map((item, idx) => (
                          <ConfusionDetectorCard key={item.id || idx} item={item} index={idx} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Interactive Checklist */}
                {activeTab === 'checklist' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Your Step-by-Step Checklist
                      </h4>
                      <span className="text-xs font-bold text-blue-700 font-mono">
                        {completedChecklistCount}/{totalChecklistCount} Completed ({checklistPercent}%)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {analysis.checklist.map((item) => (
                        <label
                          key={item.id}
                          id={`checklist-row-${item.id}`}
                          onClick={() => handleToggleChecklist(item.id)}
                          className={`flex items-center p-3 rounded-lg border transition-colors cursor-pointer select-none ${
                            item.completed
                              ? 'bg-emerald-50/60 border-emerald-200 text-slate-500'
                              : 'bg-slate-50 border-slate-200 hover:bg-white text-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className={`ml-3 text-xs sm:text-sm font-medium ${item.completed ? 'line-through' : ''}`}>
                            {item.label}
                          </span>
                          <span className="ml-auto text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                            {item.category}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Required Documents */}
                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Required Documents & Evidence
                    </h4>
                    <div className="space-y-3">
                      {analysis.documents.map((doc, idx) => (
                        <div key={doc.id || idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-bold text-slate-900 text-sm">{doc.name}</h5>
                            <EpistemicBadge source={doc.source} size="sm" />
                          </div>
                          <p className="text-slate-700">
                            <strong>Required For: </strong> {doc.requiredFor}
                          </p>
                          <div className="flex items-center justify-between flex-wrap gap-2 text-slate-500 pt-1 border-t border-slate-200 text-[11px]">
                            <span>Format: <strong className="text-slate-800">{doc.format || 'Standard'}</strong></span>
                            <span>Authority: <strong className="text-slate-800">{doc.issuingAuthority || 'Unspecified'}</strong></span>
                          </div>
                          {doc.notes && <p className="text-blue-800 italic pt-0.5">Note: {doc.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Deadlines & Authority */}
                {activeTab === 'deadlines' && (
                  <div className="space-y-5">
                    {/* Deadlines */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Hard Deadlines & Windows
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {analysis.deadlines.map((dl, idx) => (
                          <div key={dl.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                              {dl.event}
                            </div>
                            <div className="text-base font-bold text-red-600 font-mono">
                              {dl.dateOrWindow}
                            </div>
                            <div className="text-xs text-slate-600">
                              {dl.consequenceOfMissing || 'Automatic summary disqualification if missed.'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fees */}
                    {analysis.fees.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Fee Schedule & Waivers
                        </h4>
                        <div className="space-y-2">
                          {analysis.fees.map((fee, idx) => (
                            <div key={fee.id || idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900 block">{fee.item}</span>
                                <span className="text-slate-500 text-[11px]">Waiver: {fee.waiverAvailable}</span>
                              </div>
                              <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2.5 py-1 rounded border border-slate-200">
                                {fee.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Clarification Q&A */}
                {activeTab === 'qa' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        In-Context Clause Assistant
                      </h4>
                      <p className="text-xs text-slate-500">
                        Ask clarifying questions regarding this document. Gemini references the exact text provided.
                      </p>
                    </div>

                    {/* Thread */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {followupHistory.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl space-y-2">
                          <p>Ask a question about deadlines, waivers, or ambiguous clauses:</p>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {[
                              'What happens if I submit my materials 1 day late?',
                              'How do I apply for a fee waiver?',
                              'What residency documents are accepted?',
                            ].map((prompt, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setFollowupQuestion(prompt)}
                                className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 text-[11px] font-medium cursor-pointer"
                              >
                                "{prompt}"
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        followupHistory.map((msg) => {
                          const isUser = msg.role === 'user';
                          return (
                            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                                  isUser
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
                                }`}
                              >
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {isAskingFollowup && (
                        <div className="flex justify-start">
                          <div className="rounded-xl p-3 bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center space-x-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            <span>Reviewing document text...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleAskFollowup} className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <input
                        type="text"
                        id="qa-input-field"
                        value={followupQuestion}
                        onChange={(e) => setFollowupQuestion(e.target.value)}
                        placeholder="Ask a clarifying question about this document..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                      <button
                        type="submit"
                        id="qa-submit-btn"
                        disabled={!followupQuestion.trim() || isAskingFollowup}
                        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Disclaimer Bottom Banner */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
                <p className="text-[10px] text-slate-500 leading-tight italic">
                  CivicLens is an AI tool meant to assist understanding. This analysis is not legal advice. Always cross-reference with official agency instructions before submitting critical documents.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
