import { NextRequest } from 'next/server';
import { robotSimulation } from '../../lib/robotSimulation';

export const dynamic = 'force-dynamic';

// Track if simulation is already started
let simulationStarted = false;

export async function GET(req: NextRequest) {
  try {
    // Check if we're in a server environment
    if (typeof window !== 'undefined') {
      return new Response('SSE server only available on server side', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Initialize the robot simulation if not already started
    if (!simulationStarted) {
      await robotSimulation.startSimulation();
      simulationStarted = true;
    }

    // Set up Server-Sent Events
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial data
        const robots = robotSimulation.getRobots();
        const data = `data: ${JSON.stringify({ type: 'robots-update', data: robots })}\n\n`;
        controller.enqueue(encoder.encode(data));
        
        // Set up periodic updates
        const interval = setInterval(() => {
          try {
            const robots = robotSimulation.getRobots();
            const data = `data: ${JSON.stringify({ type: 'robots-update', data: robots })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error('Error sending SSE data:', error);
            clearInterval(interval);
            controller.close();
          }
        }, 500); // Update every 500ms (reduced from 200ms)
        
        // Clean up on close
        req.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('SSE server error:', error);
    return new Response('SSE server error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
