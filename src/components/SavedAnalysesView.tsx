import React, { useState } from 'react';
import { BureaucracyAnalysis, UserProfile } from '../types';
import { deleteBureaucracyAnalysis } from '../lib/firebase';
import {
  BookmarkCheck,
  Search,
  Trash2,
  CheckSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface SavedAnalysesViewProps {
  user: UserProfile | null;
  savedAnalyses: BureaucracyAnalysis[];
  onOpenAnalysis: (analysis: BureaucracyAnalysis) => void;
  onRequireAuth: () => void;
  onNavigateToDecoder: () => void;
}

export const SavedAnalysesView: React.FC<SavedAnalysesViewProps> = ({
  user,
  savedAnalyses,
  onOpenAnalysis,
  onRequireAuth,
  onNavigateToDecoder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = async (analysisId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onRequireAuth();
      return;
    }
    if (confirm('Are you sure you want to delete this saved analysis from your private Firestore?')) {
      try {
        await deleteBureaucracyAnalysis(user.uid, analysisId);
        showToast('Analysis deleted from private archive.');
      } catch (err) {
        console.error('Delete error:', err);
        showToast('Failed to delete analysis.');
      }
    }
  };

  const categories = ['All', ...Array.from(new Set(savedAnalyses.map((a) => a.category)))];

  const filtered = savedAnalyses.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.plainLanguageSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-blue-500/40 text-white text-xs font-semibold shadow-xl shadow-slate-900/40 flex items-center gap-2 animate-slide-up">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-slate-800">Private Bureaucracy Archive</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              User Silo Verified
            </span>
          </div>
          <p className="text-xs text-slate-500">
            All your decoded administrative documents, progress checklists, and ambiguity reports stored exclusively in your private Firestore database.
          </p>
        </div>

        <button
          type="button"
          id="saved-new-decode-btn"
          onClick={onNavigateToDecoder}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-blue-200" />
          <span>Decode New Document</span>
        </button>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            id="search-saved-analyses"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved policies, grants, and analyses..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              id={`filter-cat-${cat}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Saved Analyses */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
          <BookmarkCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Saved Analyses Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {savedAnalyses.length === 0
              ? 'You have not saved any decoded bureaucracy documents yet. Go to the Bureaucracy Decoder to analyze your first document.'
              : 'No documents match your search criteria.'}
          </p>
          {savedAnalyses.length === 0 && (
            <button
              type="button"
              onClick={onNavigateToDecoder}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              Decode a Sample Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const completedChecklist = item.checklist?.filter((c) => c.completed).length || 0;
            const totalChecklist = item.checklist?.length || 0;
            const percent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

            return (
              <div
                key={item.id}
                id={`saved-card-${item.id}`}
                onClick={() => onOpenAnalysis(item)}
                className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[70%]">
                      {item.category}
                    </span>
                    <button
                      type="button"
                      id={`delete-analysis-${item.id}`}
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors rounded cursor-pointer"
                      title="Delete Analysis"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.plainLanguageSummary}
                  </p>
                </div>

                {/* Metrics Badges */}
                <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Docs</span>
                      <span className="text-slate-900 font-bold">{item.documents?.length || 0}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Deadlines</span>
                      <span className="text-blue-700 font-bold">{item.deadlines?.length || 0}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Ambiguities</span>
                      <span className="text-amber-700 font-bold">{item.confusionItems?.length || 0}</span>
                    </div>
                  </div>

                  {/* Checklist progress */}
                  {totalChecklist > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <CheckSquare className="w-3 h-3 text-blue-600" />
                          Checklist:
                        </span>
                        <span className="font-mono text-blue-700 font-bold">
                          {completedChecklist}/{totalChecklist} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span>
                      Saved: {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Open Decoder <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
