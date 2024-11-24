import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileData = await file.arrayBuffer();
    let data: any[] = [];

    if (file.name.endsWith('.csv')) {
      const text = new TextDecoder().decode(fileData);
      const result = Papa.parse(text, { header: true });
      data = result.data;
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = XLSX.read(fileData);
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    // Store the data with a unique ID (you might want to use a database in production)
    const datasetId = `dataset_${Date.now()}`;
    // In a real app, you'd store this in a database
    (global as any).uploadedData = { [datasetId]: data };

    return NextResponse.json({
      success: true,
      dataset_id: datasetId,
      metadata: {
        filename: file.name,
        size: file.size,
        type: file.type
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
