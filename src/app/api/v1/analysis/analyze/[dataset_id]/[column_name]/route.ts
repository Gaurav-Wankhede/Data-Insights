import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: { dataset_id: string; column_name: string } }
) {
  const { dataset_id, column_name } = await context.params;
  try {
    const data = (global as any).uploadedData?.[dataset_id];
    if (!data) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    const column = column_name;
    const values = data.map((row: any) => row[column]).filter(Boolean);
    
    const analysis = {
      column_name: column,
      total_values: values.length,
      unique_values: new Set(values).size,
      sample_values: values.slice(0, 5),
      type: typeof values[0]
    };

    return NextResponse.json(analysis);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze column' },
      { status: 500 }
    );
  }
}

