import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataset_id, type, columns } = body;

    const data = (global as any).uploadedData?.[dataset_id];
    if (!data) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Mock visualization data
    const visualization = {
      type,
      data: {
        labels: columns,
        datasets: [{
          label: 'Dataset 1',
          data: columns.map(() => Math.random() * 100)
        }]
      }
    };

    return NextResponse.json(visualization);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate visualization' },
      { status: 500 }
    );
  }
}

