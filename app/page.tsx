"use client";

import { useState, useEffect } from "react";
import { Robot } from "./types";
import RobotCard from "./components/RobotCard";
import RobotMap from "./components/RobotMap";
import RobotDetails from "./components/RobotDetails";
import DeliveryForm from "./components/DeliveryForm";
import { Bot, Package, Plus, Wifi, WifiOff } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button, Card, CardBody, Chip, Spinner } from "@heroui/react";

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
      const response = await fetch("/api/robots");
      if (!response.ok) {
        throw new Error("Failed to fetch robots");
      }
      const robotsData = await response.json();
      setRobots(robotsData);
    } catch (error) {
      console.error("Failed to fetch robots:", error);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-foreground/60">Loading robotics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-green-500" />
            <h1 className="text-2xl font-bold text-foreground text-green-500">
              Robodash
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground/60 text-xs">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
              <Wifi className="w-4 h-4 text-success" />
              <Chip color="success" variant="flat" size="sm">
                Live
              </Chip>
            </div>

            {/* Create Delivery Button */}
            <Button
              color="success"
              variant="ghost"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => setShowDeliveryForm(true)}
            >
              New Delivery
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 p-6 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2 text-foreground">
              Robots ({robots.length})
            </h2>
            <p className="text-sm text-foreground/60">
              {robots.filter((r) => r.status === "idle").length} available
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
        <div className="flex-1 relative p-4">
          <RobotMap
            robots={robots}
            selectedRobot={selectedRobot}
            onRobotClick={handleRobotClick}
          />
        </div>

        {/* Robot Details Panel */}
        <AnimatePresence>
          {selectedRobot && (
            <RobotDetails robot={selectedRobot} onClose={closeRobotDetails} />
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
