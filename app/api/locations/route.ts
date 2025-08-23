import { NextRequest, NextResponse } from 'next/server';
import { robotSimulation } from '../../lib/robotSimulation';

export async function GET() {
  try {
    const locations = robotSimulation.getSampleLocations();
    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
