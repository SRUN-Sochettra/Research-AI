import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // PDF upload + parsing logic
    return NextResponse.json({ message: 'Document uploaded successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
