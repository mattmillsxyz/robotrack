'use client';

import { Robot } from '../types';
import dynamic from 'next/dynamic';

// Create a dynamic component wrapper for the entire map
const DynamicMap = dynamic(() => import('./RobotMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

interface RobotMapProps {
  robots: Robot[];
  selectedRobot?: Robot;
  onRobotClick: (robot: Robot) => void;
}

export default function RobotMap(props: RobotMapProps) {
  return <DynamicMap {...props} />;
}
