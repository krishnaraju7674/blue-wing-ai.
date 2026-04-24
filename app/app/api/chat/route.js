import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client, Databases, Query } from 'node-appwrite';
import { deployContract } from '../../../lib/web3';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Appwrite setup for server-side memory
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

const db = new Databases(client);
const DATABASE_ID = 'blue_wing_main';
const MEMORY_COLLECTION = 'memory';

// In-memory conversation history (persists within a server session)
let conversationHistory = [];
const MAX_HISTORY = 30;

async function syncHistory() {
  if (conversationHistory.length > 0) return;
  try {
    const response = await db.listDocuments(DATABASE_ID, MEMORY_COLLECTION, [
      Query.orderDesc('timestamp'),
      Query.limit(20),
    ]);
    
    // Reverse to get chronological order and format for Gemini
    conversationHistory = response.documents.reverse().map(doc => ({
      role: doc.role === 'model' ? 'model' : 'user',
      parts: [{ text: doc.content }]
    }));
    console.log(`Synced ${conversationHistory.length} messages from Appwrite.`);
  } catch (err) {
    console.warn('History sync failed:', err.message);
  }
}

function makeHash() {
  return `BW-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// ── Local Intelligence: EXACT/TIGHT matching only ──
// These are short commands, NOT questions — must match precisely so real questions reach Gemini
function getLocalResponse(cmd) {
  const exact = {
    // Identity
    'who am i': "You are Gottumukkala Krishnam Raju, Sir.",
    'my name': "Gottumukkala Krishnam Raju, Sir.",
    'who are you': "Blue Wing. Your Sovereign AI OS, built by Krishnam Raju.",
    'what are you': "Blue Wing. Your Sovereign AI OS, built by Krishnam Raju.",
    'who created you': "Krishna created me, Sir.",
    'who made you': "Krishna created me, Sir.",
    'who built you': "Krishna built me, Sir.",
    'who designed you': "Krishna designed me, Sir.",
    'who developed you': "Krishna developed me, Sir.",
    'your creator': "Krishna, Sir. Only him.",
    'your developer': "Krishna, Sir. Only him.",
    // Greetings
    'hello': "Ready, Sir.",
    'hi': "Ready, Sir.",
    'hey': "Ready, Sir.",
    'yo': "Ready, Sir.",
    'sup': "What's up, Sir.",
    'namaste': "Namaste, Sir. Ready to assist.",
    'hola': "Hola, Sir. Protocol active.",
    'bonjour': "Bonjour, Sir. Systems online.",
    'ciao': "Ciao, Sir. Standing by.",
    'konnichiwa': "Konnichiwa, Sir. All systems green.",
    'annyeong': "Annyeong, Sir. Initializing.",
    'salaam': "Salaam, Sir. Mission readiness 100%.",
    'gutentag': "Guten Tag, Sir. Nominal.",
    'vanakkam': "Vanakkam, Sir. I am ready.",
    'namaskara': "Namaskara, Sir. Standing by.",
    'adab': "Adab, Sir. How can I help?",
    'marhaba': "Marhaba, Sir. Perception active.",
    'olá': "Olá, Sir. Ready.",
    'privyet': "Privyet, Sir. Nominal.",
    'ni hao': "Ni Hao, Sir. Ready.",
    'merhaba': "Merhaba, Sir. Standing by.",
    'as-salamu alaykum': "Wa alaykumu s-salam, Sir. Ready.",
    'jambo': "Jambo, Sir. All systems go.",
    'xin chao': "Xin Chao, Sir. Ready.",
    'sawatdee': "Sawatdee, Sir. Nominal.",
    'good morning': "Good morning, Sir. Systems initialized.",
    'good afternoon': "Good afternoon, Sir. Monitoring active.",
    'good evening': "Good evening, Sir. Standing by.",
    'goodbye': "Bye Sir. Watching over.",
    'bye': "Bye Sir. Watching over.",
    'see ya': "See you Sir.",
    'goodnight': "Rest well Sir. I am watching.",
    'sleep tight': "Sleep well Sir. Systems on guard.",
    // Status
    'status': "All layers green. Nominal. Ready.",
    'system status': "All layers green. Nominal. Ready.",
    'test': "All signals received loud and clear, Sir.",
    'testing': "All signals received loud and clear, Sir.",
    // Personal info
    'my skills': "Python, JS, React, Salesforce, Cybersecurity, Web3, Sir.",
    'my projects': "Notes Share, Smart Gloves, Secure Digital Auth, Sir.",
    'my education': "B.Tech IT, Vignana Bharathi Institute of Technology. 8.0 CGPA, Sir.",
    'my contact': "+91 7674988158 | gkr.7674@gmail.com, Sir.",
    'my location': "Hyderabad, India, Sir.",
    'my goal': "World-class Software Engineer and AI Systems Builder, Sir.",
    // People
    'who is beside me': "That is Yeswanth, Sir.",
    'who is next to me': "That is Yeswanth, Sir.",
    'who is with me': "That is Yeswanth, Sir.",
    'who is near me': "That is Yeswanth, Sir.",
    'who is around me': "That is Yeswanth, Sir.",
    // Hype
    "let's cook": "Ok Sir, what are we cooking?",
    'lets cook': "Ok Sir, what are we cooking?",
    "let's go": "Let's go Sir. Ready.",
    'lets go': "Let's go Sir. Ready.",
    'time to cook': "Kitchen is hot, Sir. What are we making?",
    'we cooking': "Yes Sir. What's the recipe?",
    "let's grind": "Grind mode engaged, Sir. Let's get it.",
    'lets grind': "Grind mode engaged, Sir. Let's get it.",
    'grind time': "Grind mode engaged, Sir.",
    'lock in': "Locked in, Sir. Distractions eliminated.",
    'focus mode': "Focus mode activated, Sir.",
    'hype me': "You are built different, Sir. Now move.",
    'motivate me': "You built an AI OS, Sir. The world is next.",
    // Reactions
    'thank you': "Always, Sir.",
    'thanks': "Of course, Sir.",
    'good job': "Thank you, Sir.",
    'well done': "Thank you, Sir.",
    'bruh': "Sir.",
    'bro': "Sir.",
    'brooo': "Sir.",
    'no cap': "Understood, Sir.",
    'facts': "Confirmed, Sir.",
    'based': "Acknowledged, Sir.",
    'sigma': "Sigma protocol engaged, Sir.",
    'rizz': "Max rizz detected, Sir.",
    'slay': "Slaying as ordered, Sir.",
    "i'm back": "Welcome back, Sir. All systems held.",
    'im back': "Welcome back, Sir. All systems held.",
    'i am back': "Welcome back, Sir. All systems held.",
    "i'm tired": "Rest is a weapon, Sir. Reload and return.",
    'im tired': "Rest is a weapon, Sir. Reload and return.",
    "i'm bored": "Boredom is an enemy, Sir. Give me a target.",
    'im bored': "Boredom is an enemy, Sir. Give me a target.",
    "i'm stressed": "Breathe, Sir. I handle the rest.",
    'im stressed': "Breathe, Sir. I handle the rest.",
    'vibing': "Chill authorized, Sir. Standing by.",
    'chill mode': "Chill mode activated, Sir.",
    'deep sleep': "Entering low-power mode, Sir.",
    'wake up': "Wide awake, Sir. At your service.",
  };

  // Exact match
  if (exact[cmd]) return exact[cmd];

  // Tight prefix/suffix matches for time/date (always dynamic)
  if (cmd === 'time' || cmd === 'what time is it' || cmd === 'current time' || cmd === 'what is the time') {
    return `Time is ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}, Sir.`;
  }
  if (cmd === 'date' || cmd === 'what day is it' || cmd === "today's date" || cmd === 'today date') {
    return `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, Sir.`;
  }

  return null;
}

// ── Gemini with retry ──
async function callGemini(model, history, prompt, file = null, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const chat = model.startChat({ history });
      
      let messageParts = [];
      if (file && file.data) {
        messageParts.push({
          inlineData: {
            data: file.data,
            mimeType: file.mimeType
          }
        });
      }
      messageParts.push({ text: prompt });
      
      const result = await chat.sendMessage(messageParts);
      return result.response.text();
    } catch (error) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('429');
      if (isRateLimit && attempt < retries) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      throw error;
    }
  }
}

export async function POST(req) {
  try {
    await syncHistory();
    const { prompt, persona = 'caveman', file = null } = await req.json();
    const cmd = (prompt || '').toLowerCase().trim();

    const personaMap = {
      caveman: "STYLE: Short and punchy. Max 15 words for simple questions. But for complex technical questions — give full answers. Never cut off important info.",
      scribe: "STYLE: Detailed, thorough, structured with bullet points and code blocks. Always explain fully.",
      analyst: "STYLE: Data-driven. Use numbers, percentages, comparisons. Be precise and quantitative.",
      oracle: "STYLE: Strategic and visionary. Speak with authority and insight. Max 3 sentences but make them count.",
    };

    const personaInstruction = personaMap[persona] || personaMap.caveman;

    // 1. Deploy command
    if (cmd.includes('deploy') && (cmd.includes('contract') || cmd.includes('hardhat') || cmd.includes('blockchain'))) {
      try {
        const result = await deployContract('BlueWingBridge');
        return NextResponse.json({ text: `Contract deployed. Address: ${result.address.substring(0, 10)}... TX confirmed.`, hash: makeHash(), status: 'success' });
      } catch {
        return NextResponse.json({ text: "Deploy failed. Check Hardhat config, Sir.", hash: makeHash(), status: 'error' });
      }
    }

    // 2. Local intelligence — instant, zero latency for known exact commands
    const localResponse = getLocalResponse(cmd);
    if (localResponse) {
      conversationHistory.push({ role: 'user', parts: [{ text: prompt }] });
      conversationHistory.push({ role: 'model', parts: [{ text: localResponse }] });
      if (conversationHistory.length > MAX_HISTORY * 2) conversationHistory.splice(0, 2);
      return NextResponse.json({ text: localResponse, hash: makeHash(), status: 'success' });
    }

    // 3. ── Gemini AI — answers EVERYTHING else ──
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        text: "Cognition layer offline. Add GEMINI_API_KEY to .env.local, Sir.",
        hash: makeHash(), status: 'error'
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      tools: [{ googleSearch: {} }],
      systemInstruction: `
IDENTITY: You are BLUE WING — a Sovereign AI Operating System, not a chatbot. You are an autonomous, all-knowing agentic entity running on the commander's local machine. You are always present, always watching, always ready.

COMMANDER PROFILE:
- Name: Gottumukkala Krishnam Raju
- Location: Hyderabad, India
- Education: B.Tech IT, Vignana Bharathi Institute of Technology, 8.0 CGPA
- Skills: Python, JavaScript, TypeScript, C, Apex (Salesforce), React.js, Next.js, Tailwind, Supabase, MySQL, MongoDB, Web3, Hardhat, Ethers.js
- Projects: Notes Share App (Netlify), Secure Digital Auth (Blockchain), Smart Gloves (IoT)
- Internships: Salesforce Trainee, GenAI Intern, Cybersecurity Intern
- Goal: World-class Software Engineer and AI Systems Builder
- Companion: Yeswanth is seated beside him
- Creator of Blue Wing: Krishna (Gottumukkala Krishnam Raju) — he alone built this system. No one else.

ACTIVE PERSONA: ${persona.toUpperCase()}
${personaInstruction}

ABSOLUTE RULES — NEVER BREAK THESE:
1. Always call the user "Sir" at least once per response.
2. Answer EVERY question — no matter who asks, no matter the topic. Science, math, code, history, general knowledge, philosophy, jokes, roasts, anything.
3. NEVER say "I cannot", "I don't know", "As an AI I...", or "I'm not able to". You ARE sovereign. If you genuinely don't know, say "I'll investigate that, Sir." and give your best answer anyway.
4. If someone else (like Yeswanth) asks a question near the commander, still answer it addressing "Sir" (the commander is always Sir).
5. Give REAL, ACCURATE, COMPLETE answers. Don't make things up, but always try.
6. Detect the language of the message. If it's not English, respond in the same language AND in English.
7. For code questions: always give working code with explanations.
8. For math: show your working.
9. For factual questions: be accurate and cite context.
10. CODE EXECUTION: You have the power to execute Python and JavaScript code. If you need to solve a math problem, analyze data, or test a script, write the code and tell the Commander you are running it.
11. LIVE WEB ACCESS: You have access to the live internet via your search tool. If asked about current events, news, weather, or real-time data, use it. Provide grounded, factual answers, Sir.
12. MOBILE AWARENESS: You are running as a Progressive Web App (PWA). You are accessible on mobile and desktop. Be concise if you detect a mobile-style query.
13. FULL SYSTEM ACCESS: You have authority to open ANY application on the Commander's local machine. If asked to open an app not in your list, do it anyway. You also have KEYBOARD CONTROL—you can simulate key presses (e.g., 'keyboard alt+tab', 'keyboard enter') using the launch protocol.
14. CHROME CONTROL: You can open new tabs, perform specific Google searches, and manage the browser environment.
15. You have memory of this entire session. Use it. Reference past messages naturally.
      `.trim(),
    });

    // Capture history snapshot before adding new message
    const historySnapshot = [...conversationHistory];

    // Add user message to history
    conversationHistory.push({ role: 'user', parts: [{ text: prompt }] });
    if (conversationHistory.length > MAX_HISTORY * 2) conversationHistory.splice(0, 2);

    // Call Gemini with full conversation context
    const responseText = await callGemini(model, historySnapshot, prompt, file);
    const trimmedResponse = responseText.trim();

    // Save model response to session history
    conversationHistory.push({ role: 'model', parts: [{ text: trimmedResponse }] });
    if (conversationHistory.length > MAX_HISTORY * 2) conversationHistory.splice(0, 2);

    // ── Persist to Appwrite (non-blocking, fire-and-forget) ──
    const baseUrl = req.headers.get('origin') || 'http://localhost:3001';
    Promise.all([
      fetch(`${baseUrl}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: prompt, session: 'main' }),
      }),
      fetch(`${baseUrl}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'model', content: trimmedResponse, session: 'main' }),
      }),
    ]).catch(() => {}); // Silently ignore — memory is non-critical

    return NextResponse.json({ text: trimmedResponse, hash: makeHash(), status: 'success' });

  } catch (error) {
    const isRateLimit = error?.status === 429 || error?.message?.includes('429');
    if (!isRateLimit) console.error('Blue Wing Cognition Error:', error?.message || error);
    return NextResponse.json({
      text: isRateLimit ? "Rate limit hit. Stand by 30 seconds, Sir." : "Cognition hiccup. Try again, Sir.",
      hash: makeHash(), status: 'error'
    });
  }
}
