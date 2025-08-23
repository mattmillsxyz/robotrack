import { NextRequest, NextResponse } from 'next/server';
import { robotSimulation } from '../../lib/robotSimulation';

// Track if simulation is already started
let simulationStarted = false;

export async function GET() {
  try {
    // Start the simulation if not already started
    if (!simulationStarted) {
      robotSimulation.startSimulation();
      simulationStarted = true;
      console.log('Robot simulation started');
    }
    
    const robots = robotSimulation.getRobots();
    return NextResponse.json(robots);
  } catch (error) {
    console.error('Error fetching robots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch robots' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    
    if (action === 'reset') {
      robotSimulation.resetSimulation();
      simulationStarted = false; // Allow restart
      return NextResponse.json({ message: 'Simulation reset successfully' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/robots:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
