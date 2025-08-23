'use client';

import { useState, useEffect } from 'react';
import { Robot } from './types';
import RobotCard from './components/RobotCard';
import RobotMap from './components/RobotMap';
import RobotDetails from './components/RobotDetails';
import DeliveryForm from './components/DeliveryForm';
import { Package, Plus, Wifi, WifiOff } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<Robot | undefined>();
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch robots data periodically
  useEffect(() => {
    fetchRobots();
    
    // Poll for updates every 200ms to match simulation speed
    const interval = setInterval(() => {
      fetchRobots();
      setLastUpdate(new Date());
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const fetchRobots = async () => {
    try {
      const response = await fetch('/api/robots');
      if (!response.ok) {
        throw new Error('Failed to fetch robots');
      }
      const robotsData = await response.json();
      setRobots(robotsData);
    } catch (error) {
      console.error('Failed to fetch robots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRobotClick = (robot: Robot) => {
    setSelectedRobot(robot);
  };

  const handleDeliveryCreated = () => {
    fetchRobots(); // Refresh robots data
  };

  const closeRobotDetails = () => {
    setSelectedRobot(undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading robotics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-green-500" />
            <div>
              <h1 className="text-xl font-bold text-white">Moxi Robotics Dashboard</h1>
              <p className="text-sm text-gray-400">Real-time delivery fleet monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Live</span>
              <span className="text-gray-400 text-xs">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>

            {/* Create Delivery Button */}
            <button
              onClick={() => setShowDeliveryForm(true)}
              className="bg-green-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-green-400 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Delivery
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2 text-white">Robots ({robots.length})</h2>
            <p className="text-sm text-gray-400">
              {robots.filter(r => r.status === 'idle').length} available
            </p>
          </div>

          <div className="space-y-3">
            {robots.map((robot) => (
              <RobotCard
                key={robot.id}
                robot={robot}
                isSelected={selectedRobot?.id === robot.id}
                onClick={() => handleRobotClick(robot)}
              />
            ))}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          <RobotMap
            robots={robots}
            selectedRobot={selectedRobot}
            onRobotClick={handleRobotClick}
          />
        </div>

        {/* Robot Details Panel */}
        <AnimatePresence>
          {selectedRobot && (
            <RobotDetails
              robot={selectedRobot}
              onClose={closeRobotDetails}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Delivery Form Modal */}
      <AnimatePresence>
        {showDeliveryForm && (
          <DeliveryForm
            robots={robots}
            onDeliveryCreated={handleDeliveryCreated}
            onClose={() => setShowDeliveryForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
