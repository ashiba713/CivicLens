import React from 'react';
import { EpistemicSource } from '../types';
import { ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';

interface EpistemicBadgeProps {
  source: EpistemicSource;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const EpistemicBadge: React.FC<EpistemicBadgeProps> = ({
  source,
  size = 'sm',
  showLabel = true,
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  if (source === 'explicit') {
    return (
      <span
        id={`epistemic-badge-${source}`}
        title="Explicit Fact: Directly stated and quoted in the source text"
        className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap ${sizeClasses}`}
      >
        <ShieldCheck className={`${iconSize} text-emerald-600 shrink-0`} />
        {showLabel && <span>Explicit in Source</span>}
      </span>
    );
  }

  if (source === 'interpreted') {
    return (
      <span
        id={`epistemic-badge-${source}`}
        title="AI Contextual Inference: Derived from legal/institutional norms or context"
        className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap ${sizeClasses}`}
      >
        <Sparkles className={`${iconSize} text-blue-600 shrink-0`} />
        {showLabel && <span>AI Contextual Note</span>}
      </span>
    );
  }

  return (
    <span
      id={`epistemic-badge-${source}`}
      title="Missing / Ambiguous: Not specified or unclear in source text; requires official clarification"
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap ${sizeClasses}`}
    >
      <HelpCircle className={`${iconSize} text-amber-600 shrink-0`} />
      {showLabel && <span>Unspecified / Ambiguous</span>}
    </span>
  );
};

