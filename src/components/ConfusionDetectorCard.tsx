import React, { useState } from 'react';
import { ConfusionItem } from '../types';
import { AlertTriangle, HelpCircle, MessageSquareQuote, CheckCircle2, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface ConfusionDetectorCardProps {
  item: ConfusionItem;
  index: number;
}

export const ConfusionDetectorCard: React.FC<ConfusionDetectorCardProps> = ({ item, index }) => {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const issueLabels: Record<string, { label: string; bg: string; text: string }> = {
    vague_timeline: { label: 'Vague Timeline', bg: 'bg-amber-100/80', text: 'text-amber-900' },
    ambiguous_criterion: { label: 'Ambiguous Criterion', bg: 'bg-orange-100/80', text: 'text-orange-900' },
    missing_contact: { label: 'Missing Contact/Form', bg: 'bg-rose-100/80', text: 'text-rose-900' },
    contradiction: { label: 'Contradiction/Conflict', bg: 'bg-red-100/80', text: 'text-red-900' },
    hidden_gotcha: { label: 'Hidden Gotcha / Trap', bg: 'bg-purple-100/80', text: 'text-purple-900' },
    missing_form: { label: 'Omitted Form/URL', bg: 'bg-yellow-100/80', text: 'text-yellow-900' },
  };

  const badge = issueLabels[item.issueType] || { label: 'Ambiguity Alert', bg: 'bg-amber-100', text: 'text-amber-900' };

  const handleCopyQuestion = () => {
    navigator.clipboard.writeText(item.clarificationNeeded);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`confusion-item-${item.id || index}`}
      className="rounded-xl border border-amber-200 bg-amber-50/70 shadow-sm overflow-hidden transition-all duration-200 hover:border-amber-300"
    >
      {/* Header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer select-none bg-amber-50/90"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-300/60 ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
              {item.severity === 'high' && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 border border-red-200">
                  Critical Risk
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
          </div>
        </div>
        <button
          type="button"
          id={`toggle-confusion-${item.id || index}`}
          className="p-1 rounded hover:bg-amber-100 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="p-4 pt-2 space-y-3 border-t border-amber-200/80 text-xs sm:text-sm bg-white/70">
          {/* Quoted Text */}
          {item.quotedPhrase && (
            <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/90 text-slate-800 font-mono text-xs flex items-start gap-2">
              <MessageSquareQuote className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 uppercase tracking-wider text-[10px] block font-sans font-bold mb-0.5">
                  Ambiguous Text Snippet in Document:
                </span>
                <span className="italic text-amber-950 font-mono">"{item.quotedPhrase}"</span>
              </div>
            </div>
          )}

          {/* Risk */}
          <div className="space-y-1">
            <span className="text-slate-600 font-bold text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              The Hidden Risk:
            </span>
            <p className="text-slate-800 pl-3 leading-relaxed">{item.risk}</p>
          </div>

          {/* Question to ask the official agency */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-blue-900 font-bold text-xs flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                Exact Question to Ask the Agency:
              </span>
              <button
                type="button"
                id={`copy-question-btn-${item.id || index}`}
                onClick={handleCopyQuestion}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors font-medium cursor-pointer"
                title="Copy question to clipboard"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-slate-900 font-medium italic pl-1 leading-relaxed">"{item.clarificationNeeded}"</p>
          </div>

          {/* Recommended Action */}
          <div className="flex items-start gap-2 pt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700">
              <strong className="text-slate-900 font-bold">Recommended Action: </strong>
              {item.recommendedAction}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
