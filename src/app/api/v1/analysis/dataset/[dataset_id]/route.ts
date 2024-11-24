import { NextRequest, NextResponse } from 'next/server';

function calculateStats(values: number[]) {
  const n = values.length;
  if (n === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  return {
    count: n,
    mean: mean,
    std: std,
    min: sorted[0],
    '25%': sorted[Math.floor(n * 0.25)],
    '50%': sorted[Math.floor(n * 0.5)],
    '75%': sorted[Math.floor(n * 0.75)],
    max: sorted[n - 1]
  };
}

export async function GET(
  request: NextRequest,
  context: { params: { dataset_id: string } }
) {
  const { dataset_id } = context.params;

  try {
    const data = (global as any).uploadedData?.[dataset_id];
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Dataset not found or empty',
          data: null 
        },
        { status: 404 }
      );
    }

    const columns = Object.keys(data[0]);
    const description: Record<string, any> = {};

    columns.forEach(column => {
      const values = data
        .map(row => row[column])
        .filter(value => !isNaN(Number(value)))
        .map(Number);

      if (values.length > 0) {
        description[column] = calculateStats(values);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Dataset analysis completed successfully',
      data: {
        description,
        total_rows: data.length,
        total_columns: columns.length
      }
    });
  } catch (error) {
    console.error('Dataset analysis error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to analyze dataset',
        data: null 
      },
      { status: 500 }
    );
  }
}
