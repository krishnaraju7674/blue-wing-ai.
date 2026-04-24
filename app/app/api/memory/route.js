import { NextResponse } from 'next/server';
import { Client, Databases, ID, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

const db = new Databases(client);
const DATABASE_ID = 'blue_wing_main';
const MEMORY_COLLECTION = 'memory';

// GET — retrieve last N memories
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const response = await db.listDocuments(DATABASE_ID, MEMORY_COLLECTION, [
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
    ]);

    return NextResponse.json({ memories: response.documents.reverse() });
  } catch (err) {
    // Silently fail — memory is non-critical
    return NextResponse.json({ memories: [] });
  }
}

// POST — save a memory
export async function POST(req) {
  try {
    const { role, content, session } = await req.json();
    if (!role || !content) return NextResponse.json({ ok: false });

    await db.createDocument(DATABASE_ID, MEMORY_COLLECTION, ID.unique(), {
      role,
      content: content.substring(0, 4000), // Appwrite attribute limit
      session: session || 'default',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Non-blocking — if Appwrite is unavailable just skip
    return NextResponse.json({ ok: false });
  }
}
