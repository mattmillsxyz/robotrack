'use client';

import { useEffect, useRef, useState } from 'react';
import { Robot, Location } from '../types';
import { Package, MapPin, Zap, Wrench, WifiOff } from 'lucide-react';
import dynamic from 'next/dynamic';

// Create a dynamic component wrapper for the entire map
const DynamicMap = dynamic(() => import('./RobotMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
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
