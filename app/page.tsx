"use client";

import { useState, useEffect } from "react";
import { Robot } from "./types";
import RobotCard from "./components/RobotCard";
import RobotMap from "./components/RobotMap";
import RobotDetails from "./components/RobotDetails";
import DeliveryForm from "./components/DeliveryForm";
import { Bot, Plus, Wifi, Menu, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button, Chip, Spinner } from "@heroui/react";

export default function Dashboard() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [selectedRobot, setSelectedRobot] = useState<Robot | undefined>();
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRobotDetails, setShowRobotDetails] = useState(false);

  const fetchRobots = async () => {
    try {
      const response = await fetch("/api/robots");
      if (!response.ok) {
        throw new Error("Failed to fetch robots");
      }
      const robotsData = await response.json();
      setRobots(robotsData);
      
      // Update selected robot if it exists
      setSelectedRobot(currentSelected => {
        if (currentSelected) {
          const updatedSelectedRobot = robotsData.find((r: Robot) => r.id === currentSelected.id);
          return updatedSelectedRobot || currentSelected;
        }
        return currentSelected;
      });
    } catch (error) {
      console.error("Failed to fetch robots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to Server-Sent Events for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/socket');
        
        eventSource.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'robots-update') {
              const robotsData = message.data;
              setRobots(robotsData);
              setLastUpdate(new Date());
              
              // Update selected robot if it exists
              setSelectedRobot(currentSelected => {
                if (currentSelected) {
                  const updatedSelectedRobot = robotsData.find((r: Robot) => r.id === currentSelected.id);
                  return updatedSelectedRobot || currentSelected;
                }
                return currentSelected;
              });
              
              setIsLoading(false);
            }
          } catch (error) {
            console.error("Failed to parse SSE message:", error);
          }
        };
        
        eventSource.onerror = (error) => {
          console.error("SSE connection error:", error);
          // Reconnect after a delay
          setTimeout(() => {
            if (eventSource) {
              eventSource.close();
              connectSSE();
            }
          }, 5000);
        };
        
        eventSource.onopen = () => {
          console.log("SSE connection established");
        };
      } catch (error) {
        console.error("Failed to connect to SSE:", error);
        // Fallback to polling if SSE fails
        fetchRobots();
        const interval = setInterval(fetchRobots, 1000);
        return () => clearInterval(interval);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleRobotClick = (robot: Robot) => {
    setSelectedRobot(robot);
    setShowRobotDetails(true);
    // On mobile, hide sidebar when robot is selected
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleDeliveryCreated = () => {
    fetchRobots(); // Refresh robots data
  };

  const closeRobotDetails = () => {
    setSelectedRobot(undefined);
    setShowRobotDetails(false);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="primary" className="mb-4" />
          <p className="text-foreground/60 animate-pulse">Loading Robotrack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground text-green-500">
              Robotrack
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Connection Status - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-foreground/60 text-xs">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
              <Wifi className="w-4 h-4 text-success" />
              <Chip color="success" variant="flat" size="sm">
                Live
              </Chip>
            </div>

            {/* Mobile Connection Status */}
            <div className="md:hidden flex items-center gap-1">
              <Wifi className="w-4 h-4 text-success" />
              <Chip color="success" variant="flat" size="sm" className="text-xs">
                Live
              </Chip>
            </div>

            {/* Create Delivery Button - Hidden on mobile (replaced with floating button) */}
            <Button
              color="success"
              variant="ghost"
              startContent={<Plus className="w-4 h-4" />}
              onPress={() => setShowDeliveryForm(true)}
              className="hidden md:flex"
            >
              New Delivery
            </Button>

            {/* Mobile Menu Button */}
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={toggleSidebar}
              className="md:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)] relative">
        {/* Sidebar - Hidden by default on mobile */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-[9999] 
          w-80 bg-background
          transform transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${showSidebar ? 'block' : 'hidden md:block'}
        `}>
          <div className="p-4 md:p-6 md:pr-1 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:hover:scrollbar-thumb-gray-500">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h2 className="text-lg font-semibold text-foreground">Robots</h2>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => setShowSidebar(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2 text-foreground hidden md:block">
                Robots ({robots.length})
              </h2>
              <p className="text-sm text-foreground/60 hidden md:block">
                {robots.filter((r) => r.status === "idle").length} available
              </p>
            </div>

            <div className="space-y-2">
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
        </div>

        {/* Overlay for mobile sidebar */}
        {showSidebar && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Map Area */}
        <div className="flex-1 relative p-2 md:p-4">
          <RobotMap
            robots={robots}
            selectedRobot={selectedRobot}
            onRobotClick={handleRobotClick}
          />
        </div>

        {/* Robot Details Panel - Full screen on mobile */}
        <AnimatePresence>
          {selectedRobot && showRobotDetails && (
            <div className="fixed inset-0 z-50 md:relative md:z-auto">
              <div className="md:hidden fixed inset-0 bg-background">
                <RobotDetails 
                  robot={selectedRobot} 
                  onClose={closeRobotDetails}
                  isMobile={true}
                />
              </div>
              <div className="hidden md:block">
                <RobotDetails 
                  robot={selectedRobot} 
                  onClose={closeRobotDetails}
                  isMobile={false}
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <Button
          isIconOnly
          color="success"
          size="lg"
          onPress={() => setShowDeliveryForm(true)}
          className="shadow-lg"
        >
          <Plus className="w-6 h-6" />
        </Button>
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
