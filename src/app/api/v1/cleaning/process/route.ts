import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataset_id, columns, method, parameters } = body;

    // Validate request
    if (!dataset_id || !columns || !method) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Get the dataset from global storage
    const data = (global as any).uploadedData?.[dataset_id];
    if (!data) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Dataset not found' 
        },
        { status: 404 }
      );
    }

    // Process the data based on the method
    // Add your data cleaning logic here
    
    // Update the global storage with cleaned data
    (global as any).uploadedData[dataset_id] = data;

    return NextResponse.json({
      success: true,
      message: 'Data processed successfully',
      data: {
        updated_columns: columns,
        rows_affected: data.length
      }
    });
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process data' 
      },
      { status: 500 }
    );
  }
}
