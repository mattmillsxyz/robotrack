"use client";

import { useState, useEffect } from "react";
import { Robot, Location, DeliveryRequest } from "../types";
import { Package, MapPin, Plus, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";

interface DeliveryFormProps {
  robots: Robot[];
  onDeliveryCreated: () => void;
  onClose: () => void;
}

export default function DeliveryForm({
  robots,
  onDeliveryCreated,
  onClose,
}: DeliveryFormProps) {
  const [selectedRobot, setSelectedRobot] = useState<string>("");
  const [selectedStops, setSelectedStops] = useState<Location[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const availableRobots = robots.filter((robot) => robot.status === "idle");

  useEffect(() => {
    fetchAvailableLocations();
  }, []);

  // Auto-select robot if only one is available
  useEffect(() => {
    if (availableRobots.length === 1 && !selectedRobot) {
      setSelectedRobot(availableRobots[0].id);
    }
  }, [availableRobots, selectedRobot]);

  const fetchAvailableLocations = async () => {
    try {
      const response = await fetch("/api/locations");
      const locations = await response.json();
      setAvailableLocations(locations);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
  };

  const addStop = () => {
    if (selectedStops.length < 4) {
      setSelectedStops([...selectedStops, availableLocations[0]]);
    }
  };

  const removeStop = (index: number) => {
    setSelectedStops(selectedStops.filter((_, i) => i !== index));
  };

  const updateStop = (index: number, location: Location) => {
    const newStops = [...selectedStops];
    newStops[index] = location;
    setSelectedStops(newStops);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRobot || selectedStops.length === 0) {
      setError("Please select a robot and at least one stop");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const deliveryRequest: DeliveryRequest = {
        robotId: selectedRobot,
        stops: selectedStops,
      };

      const response = await fetch("/api/deliveries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deliveryRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create delivery");
      }

      onDeliveryCreated();
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create delivery"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 text-green-500">
          <Package className="w-5 h-5" />
          Create New Delivery
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Robot Selection */}
            <div>
              {/* <label className="block text-sm font-medium mb-2 text-foreground">Select Robot</label> */}
              <Select
                className="text-foreground"
                label="Robot"
                placeholder="Choose a robot..."
                onChange={(e) => setSelectedRobot(e.target.value)}
                selectedKeys={selectedRobot ? [selectedRobot] : []}
              >
                {availableRobots.map((robot: { id: string; name: string }) => (
                  <SelectItem key={robot.id} className="text-foreground">
                    {robot.name}
                  </SelectItem>
                ))}
              </Select>
              {availableRobots.length === 0 && (
                <p className="text-sm text-danger mt-1">
                  No idle robots available
                </p>
              )}
            </div>

            {/* Stops Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Delivery Stops
                </label>
                <Chip size="sm" variant="flat" color="success">
                  {selectedStops.length}/4
                </Chip>
              </div>

              <AnimatePresence>
                {selectedStops.map((stop, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2 mb-2"
                  >
                    <MapPin className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <Select
                      className="text-foreground"
                      placeholder="Choose a location..."
                      onChange={(e) => updateStop(index, availableLocations[parseInt(e.target.value)])}
                      selectedKeys={[availableLocations.findIndex(loc => 
                        loc.lat === stop.lat && loc.lng === stop.lng
                      ).toString()]}
                    >
                      {availableLocations.map((location, locIndex) => (
                        <SelectItem
                          key={locIndex.toString()}
                          className="text-foreground"
                        >
                          {location.address}
                        </SelectItem>
                      ))}
                    </Select>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => removeStop(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {selectedStops.length < 4 && (
                <Button
                  variant="bordered"
                  color="success"
                  onPress={addStop}
                  startContent={<Plus className="w-4 h-4" />}
                  className="w-full"
                >
                  Add Stop
                </Button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-danger/10 border border-danger/20 rounded-lg"
              >
                <p className="text-danger text-sm">{error}</p>
              </motion.div>
            )}
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="success"
            onPress={() => handleSubmit(new Event("submit") as unknown as React.FormEvent)}
            isLoading={isLoading}
            isDisabled={!selectedRobot || selectedStops.length === 0}
            startContent={!isLoading && <Send className="w-4 h-4" />}
          >
            {isLoading ? "Creating..." : "Create Delivery"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
