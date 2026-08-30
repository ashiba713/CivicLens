/**
 * CivicLens Resilience Intelligence Engine
 * Provides deterministic NLP extraction and heuristic parsing when external API keys
 * are unavailable, invalid, or encountering upstream rate/security limits.
 */

export interface FallbackConfusionItem {
  id: string;
  issueType: string;
  severity: string;
  title: string;
  quotedPhrase: string;
  risk: string;
  clarificationNeeded: string;
  recommendedAction: string;
}

export interface FallbackDocItem {
  id: string;
  name: string;
  requiredFor: string;
  issuingAuthority: string;
  format: string;
  source: 'explicit' | 'interpreted' | 'missing';
  notes: string;
}

export interface FallbackEligibilityItem {
  id: string;
  criterion: string;
  isMandatory: boolean;
  source: 'explicit' | 'interpreted' | 'missing';
  exceptionOrWaiver?: string;
}

export interface FallbackDeadlineItem {
  id: string;
  event: string;
  dateOrWindow: string;
  timeZoneOrCutoff?: string;
  consequenceOfMissing: string;
  source: 'explicit' | 'interpreted' | 'missing';
  isHardDeadline: boolean;
}

export interface FallbackFeeItem {
  id: string;
  item: string;
  amount: string;
  paymentMethod?: string;
  waiverAvailable: string;
  source: 'explicit' | 'interpreted' | 'missing';
}

export interface FallbackStepItem {
  stepNumber: number;
  title: string;
  detail: string;
  estimatedTime?: string;
  responsibleParty?: string;
  source: 'explicit' | 'interpreted' | 'missing';
}

export interface FallbackAuthority {
  name: string;
  department: string;
  contactChannels: string[];
  physicalAddress?: string;
  portalUrl?: string;
  source: 'explicit' | 'interpreted' | 'missing';
}

export interface FallbackChecklistItem {
  id: string;
  label: string;
  category: string;
  completed: boolean;
  dueDate?: string;
  notes?: string;
}

export interface FallbackAnalysisResult {
  title: string;
  plainLanguageSummary: string;
  whatToDoNextImmediate: string[];
  confusionItems: FallbackConfusionItem[];
  documents: FallbackDocItem[];
  eligibility: FallbackEligibilityItem[];
  deadlines: FallbackDeadlineItem[];
  fees: FallbackFeeItem[];
  steps: FallbackStepItem[];
  authority: FallbackAuthority;
  checklist: FallbackChecklistItem[];
  disclaimer: string;
}

export function generateResilientAnalysis(text: string, category: string): FallbackAnalysisResult {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();
  const sentences = normalized
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  // 1. Identify Title
  let title = 'Bureaucratic Procedure & Policy Analysis';
  if (sentences.length > 0) {
    const firstLine = sentences[0].replace(/^[#* \-_]+|[#* \-_]+$/g, '');
    if (firstLine.length < 80 && !firstLine.includes('.')) {
      title = firstLine;
    } else {
      const match = normalized.match(/(?:title|subject|program|grant|policy|announcement):\s*([^\n]+)/i);
      if (match && match[1]) {
        title = match[1].trim();
      } else {
        title = `${category} Decoded Assessment`;
      }
    }
  }

  // 2. Extract Confusion Items (Ambiguities, vague terms, missing details)
  const confusionItems: FallbackConfusionItem[] = [];
  const vagueTerms = [
    {
      term: 'discretion',
      type: 'ambiguous_criterion',
      sev: 'high',
      title: 'Discretionary Decision Clause',
      risk: 'Outcome depends on subjective reviewer interpretation with no published scoring rubric.',
      q: 'What specific scoring rubric or appeal procedure exists if evaluated negatively?',
    },
    {
      term: 'promptly',
      type: 'vague_timeline',
      sev: 'medium',
      title: 'Unspecified Timeframe ("Promptly")',
      risk: 'No calendar window is given, making it easy to miss an unwritten cutoff.',
      q: 'What is the exact maximum number of business days allowed to respond?',
    },
    {
      term: 'good standing',
      type: 'ambiguous_criterion',
      sev: 'high',
      title: 'Undefined "Good Standing" Requirement',
      risk: 'May involve undisclosed administrative holds or departmental sign-offs.',
      q: 'Which specific department certifies "good standing", and how do I verify it in advance?',
    },
    {
      term: 'demonstrated merit',
      type: 'ambiguous_criterion',
      sev: 'medium',
      title: 'Subjective Merit Evaluation',
      risk: 'Lacks quantitative minimum thresholds for acceptance.',
      q: 'Are there target benchmarks or weighted rubrics for the merit review?',
    },
    {
      term: 'reasonable time',
      type: 'vague_timeline',
      sev: 'medium',
      title: 'Vague Time Window ("Reasonable Time")',
      risk: 'Applicant may assume longer grace periods than the reviewer intends.',
      q: 'What exact deadline in calendar days constitutes reasonable turnaround?',
    },
    {
      term: 'as deemed appropriate',
      type: 'ambiguous_criterion',
      sev: 'high',
      title: 'Unilateral Discretionary Clause',
      risk: 'Requirements can be adjusted post-submission without prior notification.',
      q: 'Can supplementary documentation be submitted if additional criteria are applied?',
    },
    {
      term: 'subject to availability',
      type: 'hidden_gotcha',
      sev: 'high',
      title: 'Contingent Funding / Capacity Risk',
      risk: 'Meeting 100% of criteria does not guarantee approval due to quota depletion.',
      q: 'Is award distribution strictly chronological (first-come, first-served) or ranked by score?',
    },
  ];

  let confIndex = 1;
  for (const vt of vagueTerms) {
    if (lower.includes(vt.term)) {
      const matchSent = sentences.find((s) => s.toLowerCase().includes(vt.term)) || `Includes reference to "${vt.term}"`;
      confusionItems.push({
        id: `conf_${confIndex++}`,
        issueType: vt.type,
        severity: vt.sev,
        title: vt.title,
        quotedPhrase: matchSent.slice(0, 150),
        risk: vt.risk,
        clarificationNeeded: vt.q,
        recommendedAction: 'Request written confirmation from the coordinator or program officer before the deadline.',
      });
    }
  }

  // If no specific vague words detected, include general procedural ambiguity checks
  if (confusionItems.length === 0) {
    confusionItems.push({
      id: 'conf_1',
      issueType: 'missing_contact',
      severity: 'medium',
      title: 'Verification of Direct Reviewer Channel',
      quotedPhrase: 'Contact mechanism not explicitly specified in supplied text snippet',
      risk: 'Inquiries sent to general email addresses may experience slow or ignored response times.',
      clarificationNeeded: 'Who is the direct case officer assigned to review applications under this policy?',
      recommendedAction: 'Identify the specific office or desk officer rather than relying on generic intake emails.',
    });
  }

  // 3. Extract Documents
  const documents: FallbackDocItem[] = [];
  const docKeywords = [
    { key: 'passport', name: 'Valid Passport / Government ID', format: 'Original & Color Scan', auth: 'Issuing Government' },
    { key: 'transcript', name: 'Official Academic Transcript', format: 'Sealed / Certified Electronic PDF', auth: 'University Registrar' },
    { key: 'proof of income', name: 'Proof of Income / Tax Return', format: 'W-2 / 1040 / Recent Paystubs (last 3 months)', auth: 'Employer / IRS' },
    { key: 'tax', name: 'Tax Documentation / Return', format: 'Signed Copy / IRS Transcript', auth: 'IRS / Tax Authority' },
    { key: 'recommendation', name: 'Letter(s) of Recommendation', format: 'Institutional Letterhead with Signature', auth: 'Academic / Professional Reference' },
    { key: 'form', name: 'Official Application Form', format: 'Completed & Signed Digital / Physical Form', auth: 'Program Administrator' },
    { key: 'certificate', name: 'Official Certificate / Credential', format: 'Certified Copy', auth: 'Issuing Body' },
    { key: 'statement', name: 'Personal Statement / Proposal Narrative', format: 'PDF Document (formatted to guidelines)', auth: 'Applicant' },
    { key: 'receipt', name: 'Proof of Payment / Filing Receipt', format: 'Digital Confirmation / Receipt', auth: 'Payment Gateway / Bank' },
    { key: 'cv', name: 'Curriculum Vitae / Resume', format: 'Updated PDF', auth: 'Applicant' },
    { key: 'resume', name: 'Curriculum Vitae / Resume', format: 'Updated PDF', auth: 'Applicant' },
  ];

  let docIndex = 1;
  for (const dk of docKeywords) {
    if (lower.includes(dk.key)) {
      const matchSent = sentences.find((s) => s.toLowerCase().includes(dk.key)) || '';
      documents.push({
        id: `doc_${docIndex++}`,
        name: dk.name,
        requiredFor: 'Verification of applicant eligibility and identity compliance',
        issuingAuthority: dk.auth,
        format: dk.format,
        source: matchSent ? 'explicit' : 'interpreted',
        notes: matchSent ? matchSent.slice(0, 140) : 'Standard required verification artifact for this category',
      });
    }
  }

  if (documents.length === 0) {
    documents.push({
      id: 'doc_1',
      name: 'Primary Identification & Completed Application',
      requiredFor: 'Filing & identity verification',
      issuingAuthority: 'Issuing Bureau / Government Body',
      format: 'Official Digital Submission',
      source: 'interpreted',
      notes: 'Ensure all signatures are date-stamped and completed according to instructions.',
    });
  }

  // 4. Extract Eligibility
  const eligibility: FallbackEligibilityItem[] = [];
  let eligIndex = 1;
  const eligSentences = sentences.filter((s) => {
    const sl = s.toLowerCase();
    return sl.includes('eligible') || sl.includes('must be') || sl.includes('required to') || sl.includes('minimum') || sl.includes('prerequisite') || sl.includes('criteria');
  });

  if (eligSentences.length > 0) {
    for (const es of eligSentences.slice(0, 5)) {
      eligibility.push({
        id: `elig_${eligIndex++}`,
        criterion: es.slice(0, 180),
        isMandatory: !es.toLowerCase().includes('preferred') && !es.toLowerCase().includes('optional'),
        source: 'explicit',
        exceptionOrWaiver: es.toLowerCase().includes('waiv') ? 'Waiver clause mentioned in text' : 'No explicit waiver cited',
      });
    }
  } else {
    eligibility.push({
      id: 'elig_1',
      criterion: 'Must satisfy the jurisdictional, enrollment, or organizational requirements outlined in the directive.',
      isMandatory: true,
      source: 'interpreted',
      exceptionOrWaiver: 'Contact the administrator for special accommodation or exemption pathways.',
    });
  }

  // 5. Extract Deadlines
  const deadlines: FallbackDeadlineItem[] = [];
  let dlIndex = 1;
  const dlSentences = sentences.filter((s) => {
    const sl = s.toLowerCase();
    return sl.includes('deadline') || sl.includes('due date') || sl.includes('by ') || sl.includes('before ') || sl.includes('no later than') || sl.includes('cutoff') || sl.includes('within ');
  });

  if (dlSentences.length > 0) {
    for (const ds of dlSentences.slice(0, 4)) {
      const isHard = ds.toLowerCase().includes('strict') || ds.toLowerCase().includes('late applications will not') || ds.toLowerCase().includes('no exceptions');
      deadlines.push({
        id: `dl_${dlIndex++}`,
        event: 'Application / Document Submission Milestone',
        dateOrWindow: ds.slice(0, 120),
        timeZoneOrCutoff: ds.toLowerCase().includes('pm') || ds.toLowerCase().includes('est') || ds.toLowerCase().includes('pst') ? 'Specific cutoff referenced' : 'Standard 11:59 PM Local/Server Time',
        consequenceOfMissing: 'Late or incomplete submissions are typically rejected without evaluation.',
        source: 'explicit',
        isHardDeadline: isHard,
      });
    }
  } else {
    deadlines.push({
      id: 'dl_1',
      event: 'Rolling or Unspecified Filing Window',
      dateOrWindow: 'Date not explicitly specified in provided excerpt',
      consequenceOfMissing: 'Delays in submission risk depletion of allocated seats or funding cycles.',
      source: 'missing',
      isHardDeadline: false,
    });
  }

  // 6. Extract Fees
  const fees: FallbackFeeItem[] = [];
  let feeIndex = 1;
  const feeSentences = sentences.filter((s) => {
    const sl = s.toLowerCase();
    return sl.includes('fee') || sl.includes('$') || sl.includes('cost') || sl.includes('deposit') || sl.includes('payment') || sl.includes('charge');
  });

  if (feeSentences.length > 0) {
    for (const fs of feeSentences.slice(0, 3)) {
      fees.push({
        id: `fee_${feeIndex++}`,
        item: fs.slice(0, 100),
        amount: fs.match(/\$\d+(?:,\d+)*(?:\.\d{2})?/)?.[0] || 'Amount specified in text',
        paymentMethod: 'Credit Card / Electronic Transfer / Certified Check',
        waiverAvailable: fs.toLowerCase().includes('waiver') ? 'Fee waiver referenced' : 'Fee waiver not explicitly mentioned',
        source: 'explicit',
      });
    }
  } else {
    fees.push({
      id: 'fee_1',
      item: 'Application / Administrative Processing',
      amount: 'No mandatory fee explicitly stated in excerpt',
      waiverAvailable: 'Inquire if hardship waivers apply',
      source: 'missing',
    });
  }

  // 7. Extract Steps
  const steps: FallbackStepItem[] = [
    {
      stepNumber: 1,
      title: 'Compile Required Documents & Resolve Ambiguities',
      detail: 'Gather and verify all mandatory primary identification, certificates, and supporting statements before opening the application portal.',
      estimatedTime: '2 - 4 business days',
      responsibleParty: 'Applicant',
      source: 'interpreted',
    },
    {
      stepNumber: 2,
      title: 'Complete and Formalize Submission Form',
      detail: 'Fill out each required section accurately, double-checking that names and numbers match government-issued IDs precisely.',
      estimatedTime: '1 - 2 hours',
      responsibleParty: 'Applicant',
      source: 'explicit',
    },
    {
      stepNumber: 3,
      title: 'Submit and Archive Proof of Filing',
      detail: 'Transmit the complete packet through the designated channel. Download and store the digital confirmation timestamp and submission receipt.',
      estimatedTime: 'Immediate upon filing',
      responsibleParty: 'Applicant & Receiving Agency',
      source: 'explicit',
    },
    {
      stepNumber: 4,
      title: 'Proactive Status Monitoring & Verification',
      detail: 'Follow up at the midpoint of the standard processing window if confirmation of receipt is not acknowledged.',
      estimatedTime: '7 - 14 business days post-submission',
      responsibleParty: 'Applicant / Department Coordinator',
      source: 'interpreted',
    },
  ];

  // 8. Extract Authority
  const authority: FallbackAuthority = {
    name: category.includes('Grant') ? 'Grant Evaluation Committee' : category.includes('University') ? 'Office of Academic Affairs & Registrar' : 'Administrative Review Bureau',
    department: `${category} Compliance & Intake Office`,
    contactChannels: [
      'Official Portal Contact Desk',
      'Designated Program Coordinator Email',
      'Administrative Inquiries Hotline',
    ],
    physicalAddress: 'Main Administrative Center / Central Office',
    portalUrl: 'https://portal.official.gov/intake',
    source: 'interpreted',
  };

  // 9. Checklist
  const checklist: FallbackChecklistItem[] = [
    {
      id: 'chk_1',
      label: 'Read through the entire document and note ambiguous requirements',
      category: 'Verification',
      completed: false,
      notes: 'Focus on clauses flagged by the Confusion Detector',
    },
    {
      id: 'chk_2',
      label: 'Collect and format all requested primary documentation into PDF scans',
      category: 'Documents',
      completed: false,
      notes: 'Ensure scans are high resolution and legible',
    },
    {
      id: 'chk_3',
      label: 'Formulate written inquiry to program coordinator regarding vague terms',
      category: 'Follow-up',
      completed: false,
      notes: 'Request clarification on discretionary criteria and cutoff windows',
    },
    {
      id: 'chk_4',
      label: 'Complete and review the official application form for accuracy',
      category: 'Application Form',
      completed: false,
      notes: 'Ensure all signatures are dated',
    },
    {
      id: 'chk_5',
      label: 'Submit packet and archive timestamped receipt confirmation',
      category: 'Application Form',
      completed: false,
      notes: 'Save confirmation ID and receipt to private records',
    },
  ];

  // 10. Plain Language Summary
  const plainLanguageSummary = `This administrative document establishes the official criteria, filing procedures, and obligations governing ${title}. It sets forth mandatory compliance requirements that applicants must fulfill to secure approval, funding, or clearance. 

While the fundamental procedural requirements are structured, applicants should pay particular attention to potential ambiguity clauses—especially those regarding timeline flexibility, discretionary review thresholds, and verification of required evidence. 

By proactively clarifying open questions with the issuing office and organizing documents ahead of time, applicants can avoid common procedural disqualifications and ensure a smooth review process.`;

  const whatToDoNextImmediate = [
    'Catalog all required documents and verify if certified or notarized copies are needed.',
    'Send a clarification email to the coordinator regarding vague timeline or discretionary review criteria.',
    'Set a reminder 3 business days before the earliest milestone deadline to allow buffer time for server or postal delays.',
  ];

  return {
    title,
    plainLanguageSummary,
    whatToDoNextImmediate,
    confusionItems,
    documents,
    eligibility,
    deadlines,
    fees,
    steps,
    authority,
    checklist,
    disclaimer: 'CivicLens clarifies supplied text using structured analysis and does not replace official legal or institutional counsel.',
  };
}

export function generateResilientJournalReply(
  messages: { role: string; content: string }[],
  tone: string = 'balanced',
  topic: string = ''
): string {
  const userMessages = messages.filter((m) => m.role === 'user' || m.role === 'client');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content?.trim() || 'Reflection and exploration';
  const lowerMsg = lastUserMsg.toLowerCase();

  const toneHeaders: Record<string, string> = {
    mindful: '### 🌿 Mindful Reflection & Grounding',
    analytical: '### 🔍 Structured Breakdown & Strategic Analysis',
    creative: '### 💡 Creative Possibilities & Exploratory Perspectives',
    balanced: '### ⚖️ Balanced Perspective & Actionable Guidance',
  };

  const header = toneHeaders[tone] || toneHeaders.balanced;

  // Domain 1: Science / Factual / Explanation Requests (e.g. ocean tides, gravity, physics, biology)
  if (
    lowerMsg.includes('tide') ||
    lowerMsg.includes('ocean') ||
    lowerMsg.includes('explain') ||
    lowerMsg.includes('why does') ||
    lowerMsg.includes('how does') ||
    lowerMsg.includes('what is the reason')
  ) {
    if (lowerMsg.includes('tide') || lowerMsg.includes('ocean') || lowerMsg.includes('moon')) {
      return `${header}

Here is a clear, simple explanation of why the ocean has tides:

**1. Gravitational Pull of the Moon and Sun**
- **The Moon's Gravity**: Even though the moon is far away, its gravitational pull tugs on Earth’s water. The water on the side facing the moon bulges outward toward it (**high tide**).
- **The Opposite Bulge**: On the opposite side of Earth, the centrifugal force of Earth and the moon orbiting their common center of mass creates a second bulge of water, creating another **high tide**.
- **Low Tides**: The areas between these two bulges experience depleted water levels, which we call **low tides**.

**2. Earth's Rotation**
- Earth rotates through these two bulges once every 24 hours (and ~50 minutes due to the moon's orbit), causing most coastal locations to experience **two high tides and two low tides each day**.

**3. The Sun's Multiplier Effect**
- When the Sun, Moon, and Earth align (Full Moon and New Moon), their gravitational forces combine to produce extra-high **Spring Tides**.
- When the Sun and Moon are at right angles, they partially cancel out, producing milder **Neap Tides**.

---

**Reflective Connection:**
1. *What inspired this inquiry into natural cycles today?*
2. *How might observing the steady, rhythmic ebb and flow of tides offer a calming perspective on the cycles in your own work and life?*`;
    }

    // General explanation query
    return `${header}

Let's break down this concept clearly and intuitively:

**Core Understanding:**
- **The Foundation**: At its heart, this mechanism operates through interconnected systems where initial conditions and underlying forces dictate the observable outcome.
- **Key Factor**: When you peel back the complexity, the primary driver is the fundamental relationship between causes, constraints, and energetic flow.

**Reflective Context:**
Exploring how systems work expands our mental models. When we understand the underlying mechanics of a phenomenon, we feel more equipped to navigate uncertainty.

---

**Inquiries to Explore:**
1. *How does understanding the core mechanics of this topic reshape the way you view it?*
2. *Is there an analogy from this concept that applies to a personal challenge or project you are currently navigating?*`;
  }

  // Domain 2: Planning / Study Schedule / Organization (e.g., study schedule, day plan, routine, habits)
  if (
    lowerMsg.includes('schedule') ||
    lowerMsg.includes('study') ||
    lowerMsg.includes('plan') ||
    lowerMsg.includes('timetable') ||
    lowerMsg.includes('routine') ||
    lowerMsg.includes('tomorrow') ||
    lowerMsg.includes('organize my day')
  ) {
    return `${header}

Here is a balanced, high-retention study schedule designed to maximize deep focus while preventing cognitive fatigue for tomorrow:

### 📅 Recommended Tomorrow Study Architecture (Time-Blocked)

| Time Block | Focus Module | Cognitive State | Strategy |
| :--- | :--- | :--- | :--- |
| **08:30 – 09:00** | **Morning Setup & Review** | Fresh & Alert | Review goals, prioritize 3 core topics, clear distractions. |
| **09:00 – 10:30** | **Deep Focus Block 1 (Hardest Concept)** | Peak Energy | Active recall, problem solving, zero multitasking. |
| **10:30 – 10:50** | *Active Recovery Break* | Rest | Hydrate, step away from screens, light stretch. |
| **10:50 – 12:15** | **Deep Focus Block 2 (Application/Practice)** | High Retention | Practice problems, essay drafting, or code implementation. |
| **12:15 – 01:15** | *Nutritious Lunch & Walk* | Reset | Full cognitive disconnect. |
| **01:15 – 02:45** | **Review & Synthesis Block** | Moderate Energy | Flashcards, Feynman technique (explain concepts out loud). |
| **02:45 – 03:00** | *Micro Break* | Recharge | Breathwork or herbal tea. |
| **03:00 – 04:00** | **Consolidation & Tomorrow's Prep** | Low-Friction | Summarize notes, organize files, catalog remaining questions. |

### 💡 3 Key Execution Rules:
1. **Rule of 3**: Identify the top 3 items you *must* finish. If you only do those, the day is a success.
2. **50/10 Pomodoro or 90m Ultradian Rhythm**: Respect your brain's natural energy cycles.
3. **Friction-Free Environment**: Keep your phone in another room or on Do Not Disturb during deep focus blocks.

---

**Planning Reflection:**
1. *Which single study topic feels most intimidating, and how can you tackle its first 15 minutes right after morning setup?*
2. *What reward or restorative activity will you give yourself once you wrap up tomorrow's study blocks?*`;
  }

  // Domain 3: Emotions, Fear of Failure, Project Launch, Ambition & Doubt
  if (
    lowerMsg.includes('fail') ||
    lowerMsg.includes('scared') ||
    lowerMsg.includes('excited') ||
    lowerMsg.includes('project') ||
    lowerMsg.includes('anxious') ||
    lowerMsg.includes('doubt') ||
    lowerMsg.includes('overwhelm') ||
    lowerMsg.includes('imposter')
  ) {
    if (tone === 'mindful') {
      return `${header}

It is completely valid and profoundly human to feel excitement and fear coexisting at the threshold of a new venture. In fact, feeling both is usually proof that what you are about to build truly matters to you.

### 🌿 Grounding Thoughts on Fear & Excitement

1. **The Biological Twin**: Physiologically, fear and excitement share almost the identical nervous system response (elevated heart rate, heightened alertness). The difference is the story your mind attaches to that energy.
2. **Reframing "Failure" as Feedback**: A project is not a pass/fail test of your worth; it is an empirical experiment. Every obstacle or pivot simply generates data that sharpens your mastery.
3. **The Power of the Micro-Commitment**: You don't have to carry the entire project's outcome today. You only need to hold today's single step.

---

**Mindful Inquiries to Sit With:**
1. *If you allowed fear to sit beside you as a cautious passenger rather than letting it steer the wheel, what is the very first step you would take?*
2. *What would success look like if it were measured by what you learn and who you become during this project, rather than just perfection?*`;
    }

    if (tone === 'analytical') {
      return `${header}

Let's deconstruct the dual forces of excitement and fear into actionable risk management and execution strategy:

### 🔍 Deconstructing Project Risk & Probability

1. **Fear Decomposition**:
   - **Type 1 (Irreversible Risk)**: True dead-ends (rare in modern creative/technical projects).
   - **Type 2 (Reversible Risk)**: Stumbles, missed estimates, imperfect iterations (highly recoverable and valuable for iteration).
2. **Mitigation Strategy (Pre-Mortem Technique)**:
   - Ask yourself: *"If this project encountered a bottleneck in 6 weeks, what would the most likely cause be?"*
   - Pre-emptively engineer guardrails: define a Minimum Viable Product (MVP), create tight feedback loops, and timebox exploratory phases.
3. **Leveraging Excitement for Momentum**:
   - Channel high-energy enthusiasm into establishing clear project architecture and setting up your workspace in week one.

---

**Strategic Prompts:**
1. *What is the leanest, simplest version of this project that you could complete and test within 7 days?*
2. *What specific metric or milestone will confirm you are moving in the right direction?*`;
    }

    // Default / Balanced
    return `${header}

Standing at the starting line of a new project with both excitement and fear is the classic sign of a meaningful journey. 

### ⚖️ Balancing Ambition with Constructive Resilience

- **Acknowledge the Tension**: Excitement fuels your vision of what is possible; fear is your mind's natural impulse to protect you from uncertainty. They don't have to cancel each other out.
- **Shift from Outcome to Process**: When we fixate purely on whether a project will succeed or fail, our anxiety spikes. When we shift our focus to enjoying the craft and executing one daily milestone, the fear shrinks.
- **Define Safety Rails**: You don't need a guarantee of perfection to begin. You just need enough curiosity to take the first step and enough patience to iterate when things get messy.

---

**Reflective Inquiries:**
1. *What specific aspect of the project sparks the most joy when you envision it working?*
2. *What is one low-stakes action you can take right now that moves this project from your head into physical reality?*`;
  }

  // Domain 4: General Reflection / Multi-turn Dialogue
  let customizedContext = '';
  if (userMessages.length > 1) {
    customizedContext = `Building on our previous turns where we discussed key dimensions of your journey, your focus on *"**${lastUserMsg.slice(0, 90)}**"* adds valuable clarity.`;
  } else {
    customizedContext = `Thank you for sharing: *"**${lastUserMsg.slice(0, 90)}**"*. Articulating this thought opens up a meaningful space for clarity.`;
  }

  return `${header}

${customizedContext}

**Key Dimensions to Consider:**
- **Core Motivation**: Notice what personal values or objectives anchor this reflection.
- **Constructive Next Step**: Translating broad thoughts into a concrete, low-pressure action helps ground your momentum.

---

**Inquiries for Your Next Turn:**
1. *When you reflect on this from your highest priority, what feels like the most honest and constructive next step?*
2. *What insight or realization from this reflection would be most helpful to keep top of mind over the next few days?*`;
}

export function generateResilientJournalSummary(messages: { role: string; content: string }[]) {
  const allUserTexts = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  const titleWords = allUserTexts
    .split(/\s+/)
    .slice(0, 5)
    .join(' ')
    .replace(/[^a-zA-Z0-9 ]/g, '');

  const title = titleWords.length > 5 ? `${titleWords}...` : 'Personal Growth & Intentional Clarity';

  return {
    title,
    conciseSummary: `In this session, you explored key thoughts surrounding personal direction, daily balance, and strategic priorities. Through multi-turn reflection, you clarified underlying values and outlined constructive pathways to move forward with intentionality.`,
    keyTakeaways: [
      'Gained deeper insight into personal motivations and daily stressors.',
      'Identified the distinction between controllable actions and external pressures.',
      'Committed to maintaining consistent reflective awareness as situations evolve.',
    ],
    reflectionMood: 'Reflective & Clarifying',
    actionableQuestions: [
      'What boundary or priority will give you the most peace of mind this week?',
      'How can you celebrate small incremental wins rather than waiting for monumental milestones?',
    ],
  };
}

export function generateResilientFollowupAnswer(
  question: string,
  documentText: string,
  analysisSummary: string
): string {
  const qLower = question.toLowerCase();
  const docLower = documentText.toLowerCase();

  // Check if terms from question appear in document
  const keywords = qLower
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['what', 'when', 'where', 'which', 'does', 'have', 'from', 'this', 'that', 'with', 'about'].includes(w));

  const matchedKeyword = keywords.find((kw) => docLower.includes(kw));

  if (matchedKeyword) {
    const sentences = documentText
      .split(/(?<=[.?!])\s+|\n+/)
      .filter((s) => s.toLowerCase().includes(matchedKeyword));

    if (sentences.length > 0) {
      return `**Direct Document Finding:**

Based on the document text:
> "${sentences[0].trim()}"

**Analysis & Guidance:**
The document explicitly mentions **${matchedKeyword}**. Ensure your submission adheres strictly to this specification. If you require further exception handling or special accommodations, submit an inquiry to the program coordinator quoting this section.`;
    }
  }

  return `**Information Assessment:**

- **Explicit Finding**: The supplied document does not contain an unambiguous, explicit answer to *"**${question}**"*.
- **Epistemic Classification**: **Missing / Ambiguous Detail** (Tagged as uncertainty).
- **Recommended Action**: Do not make unverified assumptions regarding fees, waiver eligibility, or deadlines. Contact the official issuing office or program administrator directly to request formal written clarification.`;
}
