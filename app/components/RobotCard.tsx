'use client';

import { Robot } from '../types';
import { Battery, MapPin, Clock, Package, Zap, Wrench, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardBody, Chip, Progress } from "@heroui/react";

interface RobotCardProps {
  robot: Robot;
  isSelected: boolean;
  onClick: () => void;
}

const getStatusIcon = (status: Robot['status']) => {
  switch (status) {
    case 'idle':
      return <Package className="w-4 h-4 text-success" />;
    case 'delivering':
      return <MapPin className="w-4 h-4 text-success" />;
    case 'charging':
      return <Zap className="w-4 h-4 text-warning" />;
    case 'maintenance':
      return <Wrench className="w-4 h-4 text-warning" />;
    case 'offline':
      return <WifiOff className="w-4 h-4 text-danger" />;
    default:
      return <Package className="w-4 h-4 text-default-400" />;
  }
};

const getStatusColor = (status: Robot['status']) => {
  switch (status) {
    case 'idle':
      return 'success';
    case 'delivering':
      return 'success';
    case 'charging':
      return 'warning';
    case 'maintenance':
      return 'warning';
    case 'offline':
      return 'danger';
    default:
      return 'default';
  }
};

const getBatteryColor = (battery: number) => {
  if (battery > 60) return 'success';
  if (battery > 30) return 'warning';
  return 'danger';
};

export default function RobotCard({ robot, isSelected, onClick }: RobotCardProps) {
  const lastUpdate = new Date(robot.lastUpdate);
  const timeSinceUpdate = Date.now() - lastUpdate.getTime();
  const isRecent = timeSinceUpdate < 30000; // 30 seconds instead of 10

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        isPressable
        onPress={onClick}
        className={`transition-all duration-200 w-full ${
          isSelected 
            ? 'ring-2 shadow-lg' 
            : 'hover:shadow-md'
        }`}
        style={{
          borderColor: isSelected ? robot.color : undefined,
          borderWidth: isSelected ? '2px' : undefined,
        }}
        shadow="sm"
      >
        <CardBody className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: robot.color }}
              />
              {getStatusIcon(robot.status)}
              <h3 className="font-semibold text-sm text-foreground">{robot.name}</h3>
            </div>
            {/* <Chip 
              color={getStatusColor(robot.status)} 
              variant="dot" 
              size="sm"
            /> */}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Status</span>
              <Chip 
                color={getStatusColor(robot.status)} 
                variant="flat" 
                size="sm"
                className="text-xs"
              >
                {robot.status.charAt(0).toUpperCase() + robot.status.slice(1)}
              </Chip>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/60">Battery</span>
                <div className="flex items-center gap-1">
                  <Battery className="w-3 h-3" />
                  <span className={`text-${getBatteryColor(robot.battery)}`}>
                    {Math.round(robot.battery)}%
                  </span>
                </div>
              </div>
              <Progress 
                value={robot.battery} 
                color={getBatteryColor(robot.battery)}
                size="sm"
                className="w-full"
              />
            </div>

            {robot.speed > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/60">Speed</span>
                <span className="text-success">{robot.speed.toFixed(1)} km/h</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/60">Last Update</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <Chip 
                  color={isRecent ? "success" : "default"} 
                  variant="flat" 
                  size="sm"
                  className="text-xs"
                >
                  {isRecent ? 'Live' : `${Math.floor(timeSinceUpdate / 1000)}s ago`}
                </Chip>
              </div>
            </div>

            {robot.currentDelivery && (
              <Card className="bg-success/5 border border-success/20">
                <CardBody className="p-2">
                  <div className="text-xs text-success font-medium">Current Delivery</div>
                  <div className="text-xs text-foreground/60">
                    {robot.currentDelivery.stops.length} stops remaining
                  </div>
                  {robot.currentDelivery.stops.length > 0 && (
                    <div className="text-xs text-foreground/80 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {robot.currentDelivery.stops[0].address}
                        </span>
                      </div>
                    </div>
                  )}
                  {robot.routeJourney && robot.currentSegmentIndex !== undefined && (
                    <div className="text-xs text-foreground/60 mt-1">
                      <div>Segment {robot.currentSegmentIndex + 1}/{robot.routeJourney.length}</div>
                      {robot.routeProgress !== undefined && (
                        <div className="mt-1">
                          <Progress 
                            value={robot.routeProgress * 100} 
                            color="success"
                            size="sm"
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
