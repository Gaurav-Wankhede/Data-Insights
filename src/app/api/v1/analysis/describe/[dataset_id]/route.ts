import { NextRequest, NextResponse } from 'next/server';

function calculateQuantile(numbers: number[], q: number): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}

function describeNumericColumn(values: number[]) {
  const count = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / count;
  const std = Math.sqrt(
    values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count
  );
  
  return {
    count,
    mean,
    std,
    min: Math.min(...values),
    '25%': calculateQuantile(values, 0.25),
    '50%': calculateQuantile(values, 0.5),
    '75%': calculateQuantile(values, 0.75),
    max: Math.max(...values)
  };
}

export async function GET(
  request: NextRequest,
  context: { params: { dataset_id: string } }
) {
  const { dataset_id } = await context.params;
  try {
    const data = (global as any).uploadedData?.[dataset_id];
    if (!data) {
      throw new Error('Dataset not found');
    }

    const url = new URL(request.url);
    const selectedColumns = url.searchParams.get('columns')?.split(',') || [];
    const columnsToAnalyze = selectedColumns.length > 0 ? selectedColumns : Object.keys(data[0]);

    const description: Record<string, ReturnType<typeof describeNumericColumn>> = {};
    
    columnsToAnalyze.forEach(column => {
      if (column in data[0]) {
        const values = data.map((row: Record<string, any>) => row[column]).filter((v: any) => !isNaN(Number(v)));
        if (values.length > 0) {
          description[column] = describeNumericColumn(values.map(Number));
        }
      }
    });

    const qualityMetrics = {
      totalRows: data.length,
      totalColumns: columnsToAnalyze.length,
      nullValues: columnsToAnalyze.reduce((total, column) => {
        return total + data.filter((row: Record<string, any>) => row[column] === null).length;
      }, 0),
      missingValues: columnsToAnalyze.reduce((total, column) => {
        return total + data.filter((row: Record<string, any>) => 
          row[column] === undefined || row[column] === ''
        ).length;
      }, 0),
      duplicateRows: data.length - new Set(data.map((row: Record<string, any>) => 
        JSON.stringify(columnsToAnalyze.map(col => row[col]))
      )).size,
      numericColumns: columnsToAnalyze.filter(column => 
        !isNaN(Number(data[0][column]))
      ).length,
      categoricalColumns: columnsToAnalyze.filter(column => 
        isNaN(Number(data[0][column]))
      ).length
    };

    return NextResponse.json({ description, qualityMetrics });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze dataset' },
      { status: 500 }
    );
  }
}
