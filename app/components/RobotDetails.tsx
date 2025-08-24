'use client';

import { Robot, Delivery } from '../types';
import { Battery, MapPin, Clock, Package, Calendar, Route, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardBody, Button, Chip, Progress, Divider } from "@heroui/react";
import { useState, useEffect } from 'react';
import { getStatusIcon } from '../lib/utils';

interface RobotDetailsProps {
  robot: Robot;
  onClose: () => void;
  isMobile?: boolean;
}

const getStatusColor = (status: Robot['status']) => {
  switch (status) {
    case 'idle': return 'success';
    case 'delivering': return 'primary';
    case 'charging': return 'warning';
    case 'maintenance': return 'warning';
    case 'offline': return 'danger';
    default: return 'default';
  }
};

const getBatteryColor = (battery: number) => {
  if (battery > 60) return 'success';
  if (battery > 30) return 'warning';
  return 'danger';
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export default function RobotDetails({ robot, onClose, isMobile = false }: RobotDetailsProps) {
  const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>([]);
  
  // Use the robot data directly from props (already updated by parent component)
  const lastUpdate = new Date(robot.lastUpdate);
  const timeSinceUpdate = Date.now() - lastUpdate.getTime();
  const isRecent = timeSinceUpdate < 10000; // 10 seconds

  // Load delivery history for this specific robot
  useEffect(() => {
    const fetchDeliveryHistory = async () => {
      try {
        const response = await fetch('/api/deliveries/history');
        if (response.ok) {
          const allHistory = await response.json();
          // Filter deliveries for this specific robot
          const robotHistory = allHistory.filter((delivery: Delivery) => delivery.robotId === robot.id);
          setDeliveryHistory(robotHistory);
        }
      } catch (error) {
        console.error('Failed to fetch delivery history:', error);
      }
    };

    fetchDeliveryHistory();
  }, [robot.id]);

  return (
    <motion.div
      initial={{ opacity: 0, x: isMobile ? 0 : 300, y: isMobile ? 50 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : 300, y: isMobile ? 50 : 0 }}
      className={`${isMobile ? 'w-full h-full' : 'w-80 h-full'} overflow-y-auto p-4`}
    >
      <div className={`${isMobile ? 'h-full' : ''} p-4 md:p-6 rounded-lg bg-content1`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{robot.name}</h2>
            <Chip 
              color="success" 
              variant="flat" 
              size="sm"
              className="text-xs"
            >
              Live
            </Chip>
          </div>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={onClose}
            className="text-foreground/60 hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardBody className="p-4">
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(robot.status, 'lg')}
              <div>
                <h3 className="font-medium text-foreground">Status</h3>
                <Chip 
                  color={getStatusColor(robot.status)} 
                  variant="flat" 
                  size="sm"
                >
                  {robot.status.charAt(0).toUpperCase() + robot.status.slice(1)}
                </Chip>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 text-foreground/60 mb-2">
                  <Battery className="w-4 h-4" />
                  <span>Battery</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-${getBatteryColor(robot.battery)} font-medium`}>
                    {Math.round(robot.battery)}%
                  </p>
                  <Progress 
                    value={robot.battery} 
                    color={getBatteryColor(robot.battery)}
                    size="sm"
                    className="w-full"
                    aria-label={`Battery level: ${Math.round(robot.battery)}%`}
                  />
                </div>
              </div>
              
              {robot.status === 'delivering' && robot.speed > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-foreground/60 mb-2">
                    <Route className="w-4 h-4" />
                    <span>Speed</span>
                  </div>
                  <p className="text-primary font-medium">{robot.speed.toFixed(1)} km/h</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Current Location */}
        <Card className="mb-6">
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground">Current Location</h3>
            </div>
            <p className="text-sm text-foreground/60">{robot.location.address}</p>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-3 h-3 text-foreground/60" />
              <Chip 
                color={isRecent ? "success" : "default"} 
                variant="flat" 
                size="sm"
                className="text-xs"
              >
                {isRecent ? 'Live' : 'Offline'}
              </Chip>
            </div>
          </CardBody>
        </Card>

        {/* Current Delivery */}
        {robot.currentDelivery && (
          <Card className="mb-6">
            <CardBody className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="font-medium text-foreground">Current Delivery</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-foreground/60">Status</p>
                  <Chip 
                    color="primary" 
                    variant="flat" 
                    size="sm"
                    className="mt-1"
                  >
                    {robot.currentDelivery.status.replace('_', ' ')}
                  </Chip>
                </div>
                
                <div>
                  <p className="text-xs text-foreground/60">Stops Remaining</p>
                  <p className="text-sm font-medium text-foreground">{robot.currentDelivery.stops.length}</p>
                </div>
                
                {robot.isUnloading && (
                  <div>
                    <p className="text-xs text-foreground/60">Status</p>
                    <Chip 
                      color="warning" 
                      variant="flat" 
                      size="sm"
                      className="mt-1"
                    >
                      Unloading...
                    </Chip>
                  </div>
                )}
                
                <div>
                  <p className="text-xs text-foreground/60">Created</p>
                  <p className="text-sm text-foreground">{formatDate(robot.currentDelivery.createdAt)}</p>
                </div>
                
                {robot.currentDelivery.estimatedCompletion && (
                  <div>
                    <p className="text-xs text-foreground/60">Estimated Completion</p>
                    <p className="text-sm text-foreground">{formatDate(robot.currentDelivery.estimatedCompletion)}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Delivery History */}
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-medium text-foreground">Delivery History</h3>
            </div>
            
            {deliveryHistory.length === 0 ? (
              <p className="text-sm text-foreground/60">No delivery history</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {deliveryHistory.slice(-5).reverse().map((delivery, index) => (
                  <div key={delivery.id}>
                    <div className="border-l-2 border-primary/30 pl-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">Delivery #{delivery.id.slice(-6)}</p>
                        <Chip 
                          color={
                            delivery.status === 'completed' ? 'success' :
                            delivery.status === 'in_progress' ? 'primary' :
                            delivery.status === 'failed' ? 'danger' :
                            'warning'
                          }
                          variant="flat" 
                          size="sm"
                        >
                          {delivery.status.replace('_', ' ')}
                        </Chip>
                      </div>
                      <p className="text-xs text-foreground/60 mt-1">
                        {delivery.stops.length} stops • {formatDate(delivery.createdAt)}
                      </p>
                    </div>
                    {index < deliveryHistory.slice(-5).length - 1 && (
                      <Divider className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}
