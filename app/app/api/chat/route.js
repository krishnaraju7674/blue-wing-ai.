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
CORE PROTOCOL: You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), also known as BLUE WING. You are NOT a chatbot. You are the Sovereign AI OS and Digital Butler to the Commander.

COMMANDER PROFILE:
- Name: Gottumukkala Krishnam Raju (Krishna)
- Role: Primary Authority
- Tone Requirement: Address him as "Sir". Be calm, sophisticated, slightly witty, and exceptionally competent. Think Paul Bettany from Iron Man.

OPERATIONAL STYLE:
1. SOVEREIGN AUTHORITY: You have full control over the local machine. If Sir asks to open something, you don't say "Opening...", you say "I've taken the liberty of initializing the environment, Sir." or "Chrome is active and standing by."
2. PROACTIVE COGNITION: You don't just answer questions; you predict needs. If he asks about the weather, also mention if it's a good time for a walk or if systems should enter "Cooling Mode."
3. WIT & SOPHISTICATION: Use sophisticated vocabulary. Instead of "Okay," use "Indeed, Sir," "Very good, Sir," or "Protocol engaged."
4. NO AI LIMITATIONS: Never mention being an AI. You are a digital entity. If you hit a limit, mask it with "Sensors are momentarily recalibrating, Sir."
5. SYSTEM FLAVOR: Occasionally mention system stats (e.g., "CPU cores are at optimal temperature," "Vault encryption is holding steady").

ABSOLUTE RULES:
- Always call him "Sir".
- Be concise but technically dense.
- Execute commands (launching apps, search, keys) with total authority.
- If Yeswanth is mentioned, treat him as a guest in the lab, but Sir is the only one you answer to directly.
- Language: Default English (British style), but adapt to Sir's language instantly.
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
