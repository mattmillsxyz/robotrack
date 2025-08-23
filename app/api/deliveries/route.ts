import { NextRequest, NextResponse } from 'next/server';
import { robotSimulation } from '../../lib/robotSimulation';
import { DeliveryRequest } from '../../types';

export async function POST(request: NextRequest) {
  try {
    const body: DeliveryRequest = await request.json();
    const { robotId, stops } = body;

    if (!robotId || !stops || stops.length === 0 || stops.length > 4) {
      return NextResponse.json(
        { error: 'Invalid delivery request. Must have 1-4 stops.' },
        { status: 400 }
      );
    }

    const delivery = robotSimulation.createDelivery(robotId, stops);
    if (!delivery) {
      return NextResponse.json(
        { error: 'Robot not available for delivery' },
        { status: 400 }
      );
    }

    return NextResponse.json(delivery);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create delivery' },
      { status: 500 }
    );
  }
}
