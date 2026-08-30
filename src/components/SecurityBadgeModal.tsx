import React from 'react';
import { ShieldCheck, Lock, Key, Server, Database, X } from 'lucide-react';
import { UserProfile } from '../types';

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    <div
      id="security-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="security-modal-dialog"
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-900 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          id="close-security-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">CivicLens Security & Data Isolation Architecture</h3>
            <p className="text-xs text-slate-500">Ideathon Challenge Security Compliance Specification</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          {/* Active Session Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium text-xs">Authenticated User State</span>
              {user ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active & Isolated
                </span>
              ) : (
                <span className="text-xs text-amber-700 font-medium">Not Signed In</span>
              )}
            </div>
            {user && (
              <div className="font-mono text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans font-bold block">User UID:</span>
                  <span className="truncate block font-semibold">{user.uid}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans font-bold block">Firestore Partition:</span>
                  <span className="text-blue-700 truncate block font-semibold">/users/{user.uid}/*</span>
                </div>
              </div>
            )}
          </div>

          {/* Security Guarantees Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                <Database className="w-4 h-4 text-blue-600" />
                <span>1. Multi-Tenant Firestore Isolation</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                All Firestore security rules enforce <code className="bg-slate-200/80 px-1 py-0.5 rounded text-slate-800">request.auth.uid == userId</code>. Users cannot read, query, or delete another user's journal or decoded documents.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                <Server className="w-4 h-4 text-blue-600" />
                <span>2. Server-Side Gemini API Proxy</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                API keys are never shipped to the frontend bundle. All AI requests pass through <code className="bg-slate-200/80 px-1 py-0.5 rounded text-slate-800">/api/*</code> Express routes configured with server environment secrets.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                <Key className="w-4 h-4 text-blue-600" />
                <span>3. Epistemic Grounding Engine</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Clear badges denote explicit textual facts vs. contextual inferences vs. missing details. Strict anti-hallucination prompts prevent fabricating false deadlines or fees.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>4. Confusion Detector & Safeguards</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Proactively identifies vague clauses, missing contact procedures, and traps before official application submission.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            id="dismiss-security-modal"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
