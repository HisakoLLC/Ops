import { NextRequest, NextResponse } from 'next/server';
import { processLeads } from '@/lib/ingest/processor';

export async function POST(req: NextRequest) {
  try {
    // Validate shared secret header
    const secretHeader = req.headers.get('x-ingest-secret');
    const expectedSecret = process.env.INGEST_WEBHOOK_SECRET;

    if (!expectedSecret || secretHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing X-Ingest-Secret header' },
        { status: 401 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON body' }, { status: 400 });
    }

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Malformed body: Expected an array of lead objects' },
        { status: 400 }
      );
    }

    const summary = await processLeads(body);

    return NextResponse.json(summary, { status: 200 });
  } catch (error: any) {
    console.error('[Ingest Webhook Error]:', error);
    return NextResponse.json(
      { error: 'Processing Error', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
