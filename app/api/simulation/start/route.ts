import { NextResponse } from 'next/server';
import { robotSimulation } from '../../../lib/robotSimulation';

export async function POST() {
  try {
    await robotSimulation.startSimulation();
    return NextResponse.json({ message: 'Simulation started successfully' });
  } catch (error) {
    console.error('Error starting simulation:', error);
    return NextResponse.json(
      { error: 'Failed to start simulation' },
      { status: 500 }
    );
  }
}
