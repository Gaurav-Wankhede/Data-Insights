import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // For development, return mock data until backend is ready
    return NextResponse.json({
      cleaning_methods: ['drop', 'fill', 'remove_duplicates', 'remove_outliers'],
      normalization_methods: ['min_max', 'standard', 'robust'],
      transformation_methods: ['log', 'sqrt', 'power', 'one_hot', 'label']
    });
  } catch (error) {
    console.error('Methods fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaning methods' },
      { status: 500 }
    );
  }
}
