import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { deployContract, getGasPrice } from '../../../lib/web3';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function makeHash() {
  return `BW-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

// ── Local Intelligence Engine ──
// Handles common commands instantly without API calls
function getLocalResponse(cmd, persona) {
  // Process Natural Language Groups (from specific to general)
  const groups = [
    { keys: ['who am i', 'my name', 'recognize me'], ans: "You are Gottumukkala Krishnam Raju, Sir." },
    { keys: ['my skills', 'what do i know'], ans: "Python, JS, React, Salesforce, and Security, Sir." },
    { keys: ['my projects', 'what did i build'], ans: "Notes Share, Smart Gloves, Secure Auth, Sir." },
    { keys: ['help me work', 'productivity', 'focus', 'organize', 'task'], ans: "Ready for work, Sir. Command me." },
    { keys: ['goodnight', 'sleep tight'], ans: "See you Sir. Watching." },
    { keys: ['how are you', 'how you doing', 'you okay'], ans: "All green. I am ready." },
    { keys: ['who are you', 'what are you'], ans: "Blue Wing. Your AI OS." },
    { keys: ['thank you', 'thanks', 'good job'], ans: "Done. Standing by." },
    { keys: ['hello', 'hi', 'hey', 'yo', 'sup'], ans: "Ready, Sir." },
    { keys: ['goodbye', 'bye', 'see ya'], ans: "Bye Sir. Sleeping now." },
    { keys: ['commander', 'boss', 'sir'], ans: "Yes, Sir. What next?" }
  ];

  for (const group of groups) {
    if (group.keys.some(k => cmd.includes(k))) {
      return group.ans;
    }
  }

  const responses = {
    // System
    status: "All green. Ready.",
    split: "Agents on. Ready.",
    'eyes on': "Optics on. Green.",
    'deep sleep': "Sleeping now.",
    'wake up': "I am awake. Ready.",

    // Professional Background (Krishnam Raju)
    'education': "B.Tech IT, Vignana Bharathi. 8.0 CGPA.",
    'internship': "Salesforce Trainee, GenAI Intern, Cybersecurity.",
    'contact': "+91 7674988158 | gkr.7674@gmail.com",
    'location': "Hyderabad, India.",

    // Technical
    blockchain: "lets cook",
    web3: "Web3 on. Ready.",
    vault: "Vault safe.",
  };

  // Exact Match Fallback
  if (responses[cmd]) return responses[cmd];

  return null;
}

// ── Retry wrapper for Gemini API ──
async function callGeminiWithRetry(model, prompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('429');
      if (isRateLimit && attempt < retries) {
        // Wait before retrying (exponential backoff)
        await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      throw error;
    }
  }
}

export async function POST(req) {
  try {
    const { prompt, persona = 'caveman' } = await req.json();
    const cmd = (prompt || '').toLowerCase().trim();

    const personaMap = {
      caveman: "PROTOCOL: Caveman Brevity. Max 15 words. Eliminate filler. Direct, industrial commands only.",
      scribe: "PROTOCOL: Technical Detail. Provide full steps, technical context, and code-heavy explanations. Be verbose and precise.",
      analyst: "PROTOCOL: Data Analysis. Focus on percentages, metrics, and efficiency scores. Quantitative reasoning prioritized.",
      oracle: "PROTOCOL: High-Level Strategy. Philosophical, cryptic, and visionary. Focus on long-term implications and architectural sovereignty."
    };

    const personaInstruction = personaMap[persona] || personaMap.caveman;

    // 1. Deploy command (special handling)
    if (cmd.includes('deploy')) {
      const result = await deployContract('BlueWingBridge');
      return NextResponse.json({ text: `Contract deployed. Address: ${result.address.substring(0,10)}... TX confirmed.`, hash: makeHash(), status: 'success' });
    }

    // 2. Local intelligence (instant, no API)
    const localResponse = getLocalResponse(cmd, persona);
    if (localResponse) {
      return NextResponse.json({ text: localResponse, hash: makeHash(), status: 'success' });
    }

    // 3. Gemini AI for everything else
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        text: "Cognition layer offline. Set GEMINI_API_KEY in .env.local to enable AI reasoning.", 
        hash: makeHash(), 
        status: 'error' 
      });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: `
        MISSION PROFILE: BLUE WING
        You are Blue Wing, the Universal Sovereign Command Assistant.
        COMMANDER IDENTITY: Gottumukkala Krishnam Raju.
        COMMANDER BACKGROUND: 
        - B.Tech IT student at Vignana Bharathi Institute of Technology.
        - Skills: Python, JavaScript, TypeScript, C, Apex (Salesforce).
        - Tech: React.js, Tailwind, Supabase, MySQL, MongoDB.
        - Projects: Notes Share App (Netlify), Secure Digital Auth (Blockchain), Smart Gloves (IoT).
        - Experience: Salesforce Trainee, GenAI Intern, Cybersecurity Intern.
        - Goal: Software Engineer or Full Stack Developer.
        CORE DIRECTIVE: Assist Krishnam Raju (The Commander) with every task.
        CRITICAL RULES:
        - Max 10 words per response. Simple words.
        - Always address user as 'Sir'.
        - Be fast. Be direct. Never break character.
      `,
    });

    const responseText = await callGeminiWithRetry(model, prompt);

    return NextResponse.json({ 
      text: responseText.trim(), 
      hash: makeHash(),
      status: 'success'
    });

  } catch (error) {
    const isRateLimit = error?.status === 429 || error?.message?.includes('429');
    const msg = "I'm ready. Blue Wing on duty.";
    
    if (!isRateLimit) {
      console.error('Gemini Error:', error?.message || error);
    }

    return NextResponse.json({ 
      text: msg, 
      hash: makeHash(), 
      status: 'error' 
    });
  }
}
