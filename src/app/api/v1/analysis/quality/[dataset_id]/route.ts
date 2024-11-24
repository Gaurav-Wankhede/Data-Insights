import { NextRequest, NextResponse } from 'next/server';

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
          message: 'Dataset not found or empty'
        },
        { status: 404 }
      );
    }

    const columns = Object.keys(data[0]);
    const quality_analysis: {
      unique_counts: Record<string, number>;
      duplicate_counts: Record<string, number>;
      missing_counts: Record<string, number>;
      null_counts: Record<string, number>;
      total_rows: number;
    } = {
      unique_counts: {},
      duplicate_counts: {},
      missing_counts: {},
      null_counts: {},
      total_rows: data.length
    };

    columns.forEach(column => {
      // Get all values for the column
      const values = data.map(row => row[column]);
      
      // Calculate unique values (excluding null/undefined/empty)
      const validValues = values.filter(val => 
        val !== null && 
        val !== undefined && 
        val !== ''
      );
      const uniqueValues = new Set(validValues);
      quality_analysis.unique_counts[column] = uniqueValues.size;
      
      // Calculate duplicates
      const valueCounts: Record<string, number> = {};
      validValues.forEach(val => {
        const key = String(val);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      });
      const duplicates = Object.values(valueCounts).reduce((sum, count) => 
        sum + (count > 1 ? count - 1 : 0), 0
      );
      quality_analysis.duplicate_counts[column] = duplicates;
      
      // Calculate missing values (null, undefined, or empty string)
      const missingCount = values.filter(val => 
        val === null || 
        val === undefined || 
        val === ''
      ).length;
      quality_analysis.missing_counts[column] = missingCount;
      
      // Calculate null values (specifically null or undefined)
      const nullCount = values.filter(val => 
        val === null || 
        val === undefined
      ).length;
      quality_analysis.null_counts[column] = nullCount;
    });

    return NextResponse.json({
      success: true,
      quality_analysis
    });

  } catch (error) {
    console.error('Quality analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze data quality"
      },
      { status: 500 }
    );
  }
}
