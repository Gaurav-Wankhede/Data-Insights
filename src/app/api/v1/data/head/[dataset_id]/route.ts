import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: { dataset_id: string } }
) {
  const { dataset_id } = context.params;
  const url = new URL(request.url);
  const numRows = parseInt(url.searchParams.get('rows') || '5');

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

    return NextResponse.json({
      success: true,
      message: 'Dataset head retrieved successfully',
      data: {
        columns: Object.keys(firstRow),
        rows: data.slice(0, numRows),
        total_rows: data.length
      }
    });
  } catch (error) {
    console.error('Dataset head fetch error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch dataset head',
        data: null 
      },
      { status: 500 }
    );
  }
}
