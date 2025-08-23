'use client';

import { Robot } from '../types';
import { Battery, MapPin, Clock, Package, Zap, Wrench, WifiOff, Calendar, Route } from 'lucide-react';
import { motion } from 'framer-motion';

interface RobotDetailsProps {
  robot: Robot;
  onClose: () => void;
}

const getStatusIcon = (status: Robot['status']) => {
  switch (status) {
    case 'idle':
      return <Package className="w-5 h-5 text-green-400" />;
    case 'delivering':
      return <MapPin className="w-5 h-5 text-blue-400" />;
    case 'charging':
      return <Zap className="w-5 h-5 text-yellow-400" />;
    case 'maintenance':
      return <Wrench className="w-5 h-5 text-orange-400" />;
    case 'offline':
      return <WifiOff className="w-5 h-5 text-red-400" />;
    default:
      return <Package className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusColor = (status: Robot['status']) => {
  switch (status) {
    case 'idle': return 'text-green-400';
    case 'delivering': return 'text-blue-400';
    case 'charging': return 'text-yellow-400';
    case 'maintenance': return 'text-orange-400';
    case 'offline': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

const getBatteryColor = (battery: number) => {
  if (battery > 60) return 'text-green-400';
  if (battery > 30) return 'text-yellow-400';
  return 'text-red-400';
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export default function RobotDetails({ robot, onClose }: RobotDetailsProps) {
  const lastUpdate = new Date(robot.lastUpdate);
  const timeSinceUpdate = Date.now() - lastUpdate.getTime();
  const isRecent = timeSinceUpdate < 10000; // 10 seconds

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="w-80 bg-secondary border-l border-border h-full overflow-y-auto"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{robot.name}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Card */}
        <div className="bg-background rounded-lg p-4 mb-6 border border-border">
          <div className="flex items-center gap-3 mb-3">
            {getStatusIcon(robot.status)}
            <div>
              <h3 className="font-medium">Status</h3>
              <p className={`text-sm ${getStatusColor(robot.status)}`}>
                {robot.status.charAt(0).toUpperCase() + robot.status.slice(1)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Battery className="w-4 h-4" />
                <span>Battery</span>
              </div>
              <p className={getBatteryColor(robot.battery)}>{Math.round(robot.battery)}%</p>
            </div>
            
            {robot.status === 'delivering' && robot.speed > 0 && (
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Route className="w-4 h-4" />
                  <span>Speed</span>
                </div>
                <p className="text-primary">{robot.speed.toFixed(1)} km/h</p>
              </div>
            )}
          </div>
        </div>

        {/* Current Location */}
        <div className="bg-background rounded-lg p-4 mb-6 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Current Location</h3>
          </div>
          <p className="text-sm text-muted-foreground">{robot.location.address}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className={isRecent ? 'text-green-400' : ''}>
              {isRecent ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Current Delivery */}
        {robot.currentDelivery && (
          <div className="bg-background rounded-lg p-4 mb-6 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Current Delivery</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium capitalize">{robot.currentDelivery.status.replace('_', ' ')}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Stops Remaining</p>
                <p className="text-sm font-medium">{robot.currentDelivery.stops.length}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(robot.currentDelivery.createdAt)}</p>
              </div>
              
              {robot.currentDelivery.estimatedCompletion && (
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Completion</p>
                  <p className="text-sm">{formatDate(robot.currentDelivery.estimatedCompletion)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery History */}
        <div className="bg-background rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Delivery History</h3>
          </div>
          
          {robot.deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No delivery history</p>
          ) : (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {robot.deliveries.slice(-5).reverse().map((delivery) => (
                <div key={delivery.id} className="border-l-2 border-primary/30 pl-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Delivery #{delivery.id.slice(-6)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      delivery.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      delivery.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                      delivery.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {delivery.stops.length} stops • {formatDate(delivery.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
