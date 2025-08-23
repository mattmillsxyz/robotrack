import { NextRequest, NextResponse } from 'next/server';
import { robotSimulation } from '../../../lib/robotSimulation';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const robot = robotSimulation.getRobot(params.id);
    if (!robot) {
      return NextResponse.json(
        { error: 'Robot not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(robot);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch robot' },
      { status: 500 }
    );
  }
}
