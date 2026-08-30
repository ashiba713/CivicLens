/**
 * CivicLens – Full-Stack Express Server with Gemini AI & Security Verification
 * Port: 3000 (0.0.0.0)
 * All Gemini API calls are securely handled server-side.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  generateResilientAnalysis,
  generateResilientJournalReply,
  generateResilientJournalSummary,
  generateResilientFollowupAnswer,
} from './server/intelligence';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

/* =========================================================================
   1. PERSONAL GEMINI JOURNAL CHAT ENDPOINT
   ========================================================================= */
app.post('/api/journal/chat', async (req: Request, res: Response) => {
  const { messages, tone = 'balanced', sessionTopic = '' } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const toneInstructions: Record<string, string> = {
    mindful: 'Adopt a deeply empathetic, mindful, and introspective tone. Focus on emotional presence, psychological safety, grounding, and gentle inquiry.',
    analytical: 'Adopt a structured, logically organized, and analytical tone. Help deconstruct complex challenges, evaluate trade-offs, identify core priorities, and outline clear reasoning.',
    creative: 'Adopt an inspiring, exploratory, and divergent brainstorming tone. Introduce novel analogies, fresh angles, lateral perspectives, and open-ended thought experiments.',
    balanced: 'Adopt a thoughtful, articulate personal journaling companion and insightful advisor tone. Help process experiences, synthesize insights, and clarify balanced next steps.',
  };

  const systemInstruction = `You are CivicLens Personal Gemini Journal Companion — an insightful, perceptive, and supportive AI journaling sounding board.
Current Session Topic: ${sessionTopic || 'Personal Reflection & Exploration'}
Journaling Tone / Perspective: ${toneInstructions[tone] || toneInstructions.balanced}

CORE DIRECTIVES:
1. Genuinely and directly respond to the user's specific thoughts, questions, or journal entries in their current message and prior conversation context.
2. Provide tailored, meaningful insights rather than generic platitudes or repetitive canned templates.
3. Structure your response with clean markdown formatting (paragraphs, subtle bullet points when listing ideas, bold highlights).
4. End with 1-2 open, relevant reflection questions or next steps directly tied to what the user shared.
5. If the user asks a factual, planning, or explanatory question (e.g. asking for explanations, schedules, or ideas), provide the clear, direct answer with your reflective perspective.`;

  // Build clean multi-turn contents according to Gemini specification
  const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    if (!msg.content || typeof msg.content !== 'string' || !msg.content.trim()) continue;
    const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';

    // Gemini multi-turn conversation must begin with a 'user' turn.
    // If the first message in the session is a welcome greeting from the assistant, skip it from contents.
    if (formattedContents.length === 0 && role === 'model') {
      continue;
    }

    // Merge consecutive turns with the same role
    if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
      formattedContents[formattedContents.length - 1].parts[0].text += `\n\n${msg.content.trim()}`;
    } else {
      formattedContents.push({
        role,
        parts: [{ text: msg.content.trim() }],
      });
    }
  }

  // Fallback if no user message found in history
  if (formattedContents.length === 0) {
    const lastMsg = messages[messages.length - 1];
    formattedContents.push({
      role: 'user',
      parts: [{ text: lastMsg?.content?.trim() || 'Hello' }],
    });
  }

  try {
    const ai = getAIClient();
    if (!ai) {
      console.warn('[Journal Chat] GEMINI_API_KEY not found in environment, activating fallback engine');
      const reply = generateResilientJournalReply(messages, tone, sessionTopic);
      return res.json({ reply, mode: 'resilient_engine' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text;
    if (replyText && replyText.trim().length > 0) {
      return res.json({ reply: replyText.trim(), mode: 'gemini_live' });
    }

    throw new Error('Empty response received from Gemini model');
  } catch (error: any) {
    console.error('[Journal Chat API Error]:', error?.message || error);
    // Use fallback engine only when API throws an error
    const reply = generateResilientJournalReply(messages, tone, sessionTopic);
    return res.json({
      reply,
      mode: 'resilient_engine',
      apiError: error?.message || 'Upstream Gemini call encountered an issue',
    });
  }
});

/* =========================================================================
   2. PERSONAL GEMINI JOURNAL SUMMARY ENDPOINT
   ========================================================================= */
app.post('/api/journal/summarize', async (req: Request, res: Response) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    const ai = getAIClient();
    if (!ai) {
      console.warn('[Journal Summarize] GEMINI_API_KEY not found in environment, activating fallback engine');
      const summary = generateResilientJournalSummary(messages);
      return res.json({ summary, mode: 'resilient_engine' });
    }

    const conversationTranscript = messages
      .filter((m: { role: string; content: string }) => m.content && m.content.trim())
      .map((m: { role: string; content: string }) => `${(m.role === 'assistant' || m.role === 'model' ? 'ASSISTANT' : 'USER')}: ${m.content.trim()}`)
      .join('\n\n');

    const prompt = `Analyze this personal journal transcript and generate a structured JSON summary.

TRANSCRIPT:
${conversationTranscript}

Generate a concise, insightful reflection summary adhering strictly to this JSON format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are an expert psychological reflection analyst. Extract the core essence, psychological mood, key insights, and 2 forward-looking reflection prompts.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Short evocative title for the journal session (3-6 words)' },
            conciseSummary: { type: Type.STRING, description: '2-3 sentence overarching synthesis of what was explored' },
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 key bullet takeaways or realizations',
            },
            reflectionMood: { type: Type.STRING, description: 'Identified emotional/intellectual mood (e.g., Cautiously Optimistic, Clarifying Goals, Deep Resolution)' },
            actionableQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 thoughtful inquiry questions for future journaling',
            },
          },
          required: ['title', 'conciseSummary', 'keyTakeaways', 'reflectionMood', 'actionableQuestions'],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);
    return res.json({ summary: parsed, mode: 'gemini_live' });
  } catch (error: any) {
    console.error('[Journal Summarize API Error]:', error?.message || error);
    const summary = generateResilientJournalSummary(messages);
    return res.json({
      summary,
      mode: 'resilient_engine',
      apiError: error?.message || 'Upstream Gemini summarize call encountered an issue',
    });
  }
});

/* =========================================================================
   3. BUREAUCRACY DECODER & CONFUSION DETECTOR ENDPOINT
   ========================================================================= */
app.post('/api/decoder/analyze', async (req: Request, res: Response) => {
  const { text, category = 'General Bureaucracy' } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 20) {
    return res.status(400).json({
      error: 'Please supply sufficient bureaucratic text (at least 20 characters) to analyze.',
    });
  }

  try {
    const ai = getAIClient();
    if (!ai) {
      const analysis = generateResilientAnalysis(text, category);
      return res.json({ analysis, mode: 'resilient_engine' });
    }

    const systemInstruction = `You are CivicLens Bureaucracy Decoder & Confusion Detector — a world-class legal-administrative clarity engine.

CORE MISSION & EPISTEMIC HONESTY:
1. Transform complex, convoluted, or bureaucratic text into crystal-clear plain language.
2. NEVER hallucinate or invent deadlines, documents, eligibility criteria, fees, or procedural requirements not grounded in the text.
3. Every extracted item MUST have an epistemic source flag:
   - "explicit": Direct quote or fact stated unambiguously in the text.
   - "interpreted": Logical domain inference / standard institutional practice derived from context.
   - "missing": Crucial detail that is omitted, ambiguous, or left unclear in the supplied text.

CONFUSION DETECTOR (STANDOUT ORIGINAL FEATURE):
Actively scan the text for:
- Vague timelines (e.g. "promptly", "reasonable time", "as soon as feasible")
- Ambiguous criteria (e.g. "good standing", "demonstrated merit", "at the discretion of the committee")
- Contradictory instructions or dates
- Missing contact persons, forms, or URLs
- Hidden traps / catch-22 conditions
For each confusion point, formulate the exact question the applicant should ask the official agency before proceeding.

OUTPUT REQUIREMENT:
Return a valid, comprehensive JSON object matching the requested schema.`;

    const prompt = `DECODE AND ANALYZE THE FOLLOWING BUREAUCRATIC TEXT:
CATEGORY HINT: ${category}

SOURCE TEXT:
"""
${text}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Descriptive title of this bureaucratic process or document' },
            plainLanguageSummary: { type: Type.STRING, description: 'A 2-3 paragraph plain-English explanation of what this document is, what it grants or requires, and what it means for the applicant.' },
            whatToDoNextImmediate: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactly 3 highest-priority immediate actions to take first',
            },
            confusionItems: {
              type: Type.ARRAY,
              description: 'Ambiguities, vague terms, missing information, or traps detected by the Confusion Detector',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  issueType: {
                    type: Type.STRING,
                    description: 'vague_timeline | ambiguous_criterion | missing_contact | contradiction | hidden_gotcha | missing_form',
                  },
                  severity: { type: Type.STRING, description: 'high | medium | low' },
                  title: { type: Type.STRING, description: 'Short summary of the confusion point' },
                  quotedPhrase: { type: Type.STRING, description: 'Exact quote or description of omitted item' },
                  risk: { type: Type.STRING, description: 'Why this ambiguity creates risk or delays for the applicant' },
                  clarificationNeeded: { type: Type.STRING, description: 'Specific question to ask the agency/officer' },
                  recommendedAction: { type: Type.STRING, description: 'Immediate preventive step to protect applicant' },
                },
                required: ['id', 'issueType', 'severity', 'title', 'quotedPhrase', 'risk', 'clarificationNeeded', 'recommendedAction'],
              },
            },
            documents: {
              type: Type.ARRAY,
              description: 'Required evidence, forms, certificates, or IDs',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  requiredFor: { type: Type.STRING },
                  issuingAuthority: { type: Type.STRING },
                  format: { type: Type.STRING, description: 'e.g., Original Certified Copy, PDF Scan, Notarized' },
                  source: { type: Type.STRING, description: 'explicit | interpreted | missing' },
                  notes: { type: Type.STRING },
                },
                required: ['id', 'name', 'requiredFor', 'issuingAuthority', 'format', 'source', 'notes'],
              },
            },
            eligibility: {
              type: Type.ARRAY,
              description: 'Eligibility requirements and prerequisites',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  criterion: { type: Type.STRING },
                  isMandatory: { type: Type.BOOLEAN },
                  source: { type: Type.STRING, description: 'explicit | interpreted | missing' },
                  exceptionOrWaiver: { type: Type.STRING },
                },
                required: ['id', 'criterion', 'isMandatory', 'source'],
              },
            },
            deadlines: {
              type: Type.ARRAY,
              description: 'Cutoffs, milestone dates, and processing windows',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  event: { type: Type.STRING },
                  dateOrWindow: { type: Type.STRING },
                  timeZoneOrCutoff: { type: Type.STRING },
                  consequenceOfMissing: { type: Type.STRING },
                  source: { type: Type.STRING, description: 'explicit | interpreted | missing' },
                  isHardDeadline: { type: Type.BOOLEAN },
                },
                required: ['id', 'event', 'dateOrWindow', 'consequenceOfMissing', 'source', 'isHardDeadline'],
              },
            },
            fees: {
              type: Type.ARRAY,
              description: 'Fees, costs, deposits, and payment methods',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  item: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  paymentMethod: { type: Type.STRING },
                  waiverAvailable: { type: Type.STRING },
                  source: { type: Type.STRING, description: 'explicit | interpreted | missing' },
                },
                required: ['id', 'item', 'amount', 'waiverAvailable', 'source'],
              },
            },
            steps: {
              type: Type.ARRAY,
              description: 'Chronological step-by-step action plan',
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  estimatedTime: { type: Type.STRING },
                  responsibleParty: { type: Type.STRING },
                  source: { type: Type.STRING, description: 'explicit | interpreted | missing' },
                },
                required: ['stepNumber', 'title', 'detail', 'source'],
              },
            },
            authority: {
              type: Type.OBJECT,
              description: 'Responsible office, agency, or department info',
              properties: {
                name: { type: Type.STRING },
                department: { type: Type.STRING },
                contactChannels: { type: Type.ARRAY, items: { type: Type.STRING } },
                physicalAddress: { type: Type.STRING },
                portalUrl: { type: Type.STRING },
                source: { type: Type.STRING, description: 'explicit | interpreted | missing' },
              },
              required: ['name', 'department', 'contactChannels', 'source'],
            },
            checklist: {
              type: Type.ARRAY,
              description: 'Interactive tasks user needs to accomplish',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  category: { type: Type.STRING, description: 'Documents | Application Form | Payment | Verification | Follow-up | Other' },
                  completed: { type: Type.BOOLEAN },
                  dueDate: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: ['id', 'label', 'category', 'completed'],
              },
            },
            disclaimer: {
              type: Type.STRING,
              description: 'Formal advisory disclaimer emphasizing that this is an AI simplification of supplied text and not legal counsel',
            },
          },
          required: [
            'title',
            'plainLanguageSummary',
            'whatToDoNextImmediate',
            'confusionItems',
            'documents',
            'eligibility',
            'deadlines',
            'fees',
            'steps',
            'authority',
            'checklist',
            'disclaimer',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ analysis: parsed });
  } catch (error: any) {
    // Graceful fallback to resilient extraction engine
    const analysis = generateResilientAnalysis(text, category);
    return res.json({ analysis, mode: 'resilient_engine' });
  }
});

/* =========================================================================
   4. ASK FOLLOW-UP QUESTION ON DECODED DOCUMENT
   ========================================================================= */
app.post('/api/decoder/ask-followup', async (req: Request, res: Response) => {
  const { documentText, analysisSummary, question, history = [] } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const ai = getAIClient();
    if (!ai) {
      const answer = generateResilientFollowupAnswer(question, documentText || '', analysisSummary || '');
      return res.json({ answer, mode: 'resilient_engine' });
    }

    const systemInstruction = `You are CivicLens Bureaucracy Advisor. The user is asking a specific follow-up question regarding a bureaucratic document they analyzed.

SOURCE DOCUMENT:
"""
${documentText || 'No raw text provided. Refer to analysis summary.'}
"""

ANALYSIS SUMMARY:
"""
${analysisSummary || ''}
"""

RULES:
1. Answer the question directly, concisely, and accurately.
2. If the answer is explicitly stated in the document, quote or cite the relevant part.
3. If the answer is NOT mentioned or left ambiguous in the document, explicitly say so and tell the user who to contact or what to ask to obtain certainty.
4. Format with clean markdown for maximum legibility.`;

    const contents = [
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      { role: 'user', parts: [{ text: question }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { systemInstruction },
    });

    return res.json({ answer: response.text || 'Unable to generate an answer at this time.' });
  } catch (error: any) {
    const answer = generateResilientFollowupAnswer(question, documentText || '', analysisSummary || '');
    return res.json({ answer, mode: 'resilient_engine' });
  }
});

/* =========================================================================
   SERVER BOOTSTRAP & VITE MIDDLEWARE
   ========================================================================= */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicLens server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
