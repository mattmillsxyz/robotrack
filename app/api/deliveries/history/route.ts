import { NextResponse } from 'next/server';
import { PersistenceManager } from '../../../lib/persistence';

export async function GET() {
  try {
    const deliveries = await PersistenceManager.loadDeliveries();
    return NextResponse.json(deliveries);
  } catch (error) {
    console.error('Failed to fetch delivery history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery history' },
      { status: 500 }
    );
  }
}
