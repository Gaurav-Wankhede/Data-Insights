import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: { dataset_id: string } }
) {
  const { dataset_id } = await context.params;
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

    const firstRow = data[0];
    if (!firstRow || typeof firstRow !== 'object') {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid dataset format',
          data: null 
        },
        { status: 400 }
      );
    }

    const columns = Object.keys(firstRow);
    return NextResponse.json({
      success: true,
      message: 'Columns retrieved successfully',
      data: {
        columns: columns,
        column_types: columns.reduce((acc, column) => {
          const values = data.map(row => row[column]).filter(v => v !== undefined);
          const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
          acc[column] = numericValues.length === values.length ? 'numeric' : 'categorical';
          return acc;
        }, {} as Record<string, string>),
        total_columns: columns.length,
        column_info: columns.map(column => {
          const values = data.map(row => row[column]).filter(v => v !== undefined);
          const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
          return {
            name: column,
            type: numericValues.length === values.length ? 'numeric' : 'categorical',
            missing_count: data.length - values.length,
            unique_count: new Set(values).size
          };
        })
      }
    });
  } catch (error) {
    console.error('Column fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch columns',
        data: null 
      },
      { status: 500 }
    );
  }
}
