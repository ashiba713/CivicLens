/**
 * CivicLens – AI Bureaucracy Layer & Personal Journal
 * Global TypeScript Interfaces and Types
 */

export type EpistemicSource = 'explicit' | 'interpreted' | 'missing';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface JournalSummary {
  title: string;
  conciseSummary: string;
  keyTakeaways: string[];
  reflectionMood: string;
  actionableQuestions: string[];
}

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: JournalMessage[];
  summary?: JournalSummary;
  tags?: string[];
}

export interface ConfusionItem {
  id: string;
  issueType: 'vague_timeline' | 'ambiguous_criterion' | 'missing_contact' | 'contradiction' | 'hidden_gotcha' | 'missing_form';
  severity: 'high' | 'medium' | 'low';
  title: string;
  quotedPhrase: string;
  risk: string;
  clarificationNeeded: string;
  recommendedAction: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  requiredFor: string;
  issuingAuthority: string;
  format: string; // e.g. "Original Certified", "PDF Scan", "Notarized"
  source: EpistemicSource;
  notes: string;
}

export interface EligibilityItem {
  id: string;
  criterion: string;
  isMandatory: boolean;
  source: EpistemicSource;
  exceptionOrWaiver?: string;
}

export interface DeadlineItem {
  id: string;
  event: string;
  dateOrWindow: string;
  timeZoneOrCutoff?: string;
  consequenceOfMissing: string;
  source: EpistemicSource;
  isHardDeadline: boolean;
}

export interface FeeItem {
  id: string;
  item: string;
  amount: string;
  paymentMethod?: string;
  waiverAvailable: string;
  source: EpistemicSource;
}

export interface ActionStep {
  stepNumber: number;
  title: string;
  detail: string;
  estimatedTime?: string;
  responsibleParty?: string;
  source: EpistemicSource;
}

export interface AuthorityInfo {
  name: string;
  department: string;
  contactChannels: string[];
  physicalAddress?: string;
  portalUrl?: string;
  source: EpistemicSource;
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: 'Documents' | 'Application Form' | 'Payment' | 'Verification' | 'Follow-up' | 'Other';
  completed: boolean;
  dueDate?: string;
  notes?: string;
}

export type InstitutionCategory =
  | 'Government Benefit & Program'
  | 'University & Academic Fellowship'
  | 'Immigration & Visa Status'
  | 'Housing & Municipal Assistance'
  | 'Small Business & Grant'
  | 'Healthcare & Insurance'
  | 'Legal & Regulatory'
  | 'General Bureaucracy';

export interface BureaucracyAnalysis {
  id: string;
  userId: string;
  title: string;
  category: InstitutionCategory;
  sourceTextSnippet: string;
  sourceTextFull: string;
  createdAt: number;
  updatedAt: number;
  plainLanguageSummary: string;
  whatToDoNextImmediate: string[]; // 3 immediate actionable bullet points
  confusionItems: ConfusionItem[];
  documents: DocumentItem[];
  eligibility: EligibilityItem[];
  deadlines: DeadlineItem[];
  fees: FeeItem[];
  steps: ActionStep[];
  authority: AuthorityInfo;
  checklist: ChecklistItem[];
  disclaimer: string;
  isSaved?: boolean;
}

export interface FollowupMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  quotedSources?: string[];
}
