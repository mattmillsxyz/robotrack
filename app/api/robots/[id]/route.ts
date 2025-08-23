import { NextRequest, NextResponse } from 'next/server';
import { robotSimulation } from '../../../lib/robotSimulation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const robot = robotSimulation.getRobot(id);
    if (!robot) {
      return NextResponse.json(
        { error: 'Robot not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(robot);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch robot' },
      { status: 500 }
    );
  }
}
