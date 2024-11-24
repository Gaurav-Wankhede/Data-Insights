import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const datasets = Object.keys((global as any).uploadedData || {}).map(id => ({
      id,
      metadata: {
        created_at: new Date(parseInt(id.split('_')[1])).toISOString()
      }
    }));

    return NextResponse.json({ datasets });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

