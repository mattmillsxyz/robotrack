import { NextResponse } from 'next/server';
import { robotSimulation } from '../../lib/robotSimulation';

export async function GET() {
  try {
    const chargingStations = robotSimulation.getChargingStations();
    return NextResponse.json(chargingStations);
  } catch (error) {
    console.error('Error fetching charging stations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charging stations' },
      { status: 500 }
    );
  }
}
