'use client';

import { Robot } from '../types';
import { Battery, MapPin, Clock, Package, Zap, Wrench, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface RobotCardProps {
  robot: Robot;
  isSelected: boolean;
  onClick: () => void;
}

const getStatusIcon = (status: Robot['status']) => {
  switch (status) {
    case 'idle':
      return <Package className="w-4 h-4 text-green-400" />;
    case 'delivering':
      return <MapPin className="w-4 h-4 text-green-400" />;
    case 'charging':
      return <Zap className="w-4 h-4 text-yellow-400" />;
    case 'maintenance':
      return <Wrench className="w-4 h-4 text-orange-400" />;
    case 'offline':
      return <WifiOff className="w-4 h-4 text-red-400" />;
    default:
      return <Package className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusColor = (status: Robot['status']) => {
  switch (status) {
    case 'idle':
      return 'bg-green-500/20 border-green-500/30';
    case 'delivering':
      return 'bg-green-500/20 border-green-500/30';
    case 'charging':
      return 'bg-yellow-500/20 border-yellow-500/30';
    case 'maintenance':
      return 'bg-orange-500/20 border-orange-500/30';
    case 'offline':
      return 'bg-red-500/20 border-red-500/30';
    default:
      return 'bg-gray-500/20 border-gray-500/30';
  }
};

const getBatteryColor = (battery: number) => {
  if (battery > 60) return 'text-green-400';
  if (battery > 30) return 'text-yellow-400';
  return 'text-red-400';
};

export default function RobotCard({ robot, isSelected, onClick }: RobotCardProps) {
  const lastUpdate = new Date(robot.lastUpdate);
  const timeSinceUpdate = Date.now() - lastUpdate.getTime();
  const isRecent = timeSinceUpdate < 30000; // 30 seconds instead of 10

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/20' 
          : 'bg-secondary/50 border-border hover:bg-secondary/70'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(robot.status)}
          <h3 className="font-semibold text-sm text-white">{robot.name}</h3>
        </div>
        <div className={`w-2 h-2 rounded-full ${getStatusColor(robot.status).split(' ')[0]}`} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Status</span>
          <span className={`text-xs font-medium ${
            robot.status === 'idle' ? 'text-green-400' :
            robot.status === 'delivering' ? 'text-green-400' :
            robot.status === 'charging' ? 'text-yellow-400' :
            robot.status === 'maintenance' ? 'text-orange-400' :
            'text-red-400'
          }`}>
            {robot.status.charAt(0).toUpperCase() + robot.status.slice(1)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Battery</span>
          <div className="flex items-center gap-1">
            <Battery className="w-3 h-3" />
            <span className={getBatteryColor(robot.battery)}>
              {Math.round(robot.battery)}%
            </span>
          </div>
        </div>

        {robot.status === 'delivering' && robot.speed > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Speed</span>
            <span className="text-green-400">{robot.speed.toFixed(1)} km/h</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Last Update</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className={isRecent ? 'text-green-400' : 'text-muted-foreground'}>
              {isRecent ? 'Live' : `${Math.floor(timeSinceUpdate / 1000)}s ago`}
            </span>
          </div>
        </div>

        {robot.currentDelivery && (
          <div className="mt-2 p-2 bg-green-500/5 rounded border border-green-500/20">
            <div className="text-xs text-green-400 font-medium">Current Delivery</div>
            <div className="text-xs text-muted-foreground">
              {robot.currentDelivery.stops.length} stops remaining
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
