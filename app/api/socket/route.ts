// import { NextRequest } from 'next/server'; // Unused import
import { robotSimulation } from '../../lib/robotSimulation';

export const dynamic = 'force-dynamic';

// Track if simulation is already started
let simulationStarted = false;

export async function GET() {
  try {
    // Check if we're in a server environment
    if (typeof window !== 'undefined') {
      return new Response('WebSocket server only available on server side', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Initialize the robot simulation if not already started
    if (!simulationStarted) {
      robotSimulation.startSimulation();
      simulationStarted = true;
    }

    // For now, just return a success response
    // The WebSocket will be handled by the client-side connection
    return new Response('WebSocket server is running', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('WebSocket server error:', error);
    return new Response('WebSocket server error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
