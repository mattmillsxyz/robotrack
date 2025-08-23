'use client';

import { useState, useEffect } from 'react';
import { Robot, Location, DeliveryRequest } from '../types';
import { Package, MapPin, Plus, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeliveryFormProps {
  robots: Robot[];
  onDeliveryCreated: () => void;
  onClose: () => void;
}

export default function DeliveryForm({ robots, onDeliveryCreated, onClose }: DeliveryFormProps) {
  const [selectedRobot, setSelectedRobot] = useState<string>('');
  const [selectedStops, setSelectedStops] = useState<Location[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const availableRobots = robots.filter(robot => robot.status === 'idle');

  useEffect(() => {
    fetchAvailableLocations();
  }, []);

  const fetchAvailableLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      const locations = await response.json();
      setAvailableLocations(locations);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
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
      setError('Please select a robot and at least one stop');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const deliveryRequest: DeliveryRequest = {
        robotId: selectedRobot,
        stops: selectedStops,
      };

      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deliveryRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create delivery');
      }

      onDeliveryCreated();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create delivery');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-secondary border border-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Create New Delivery
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Robot Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Robot</label>
            <select
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
              className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Choose a robot...</option>
              {availableRobots.map((robot) => (
                <option key={robot.id} value={robot.id}>
                  {robot.name} (Battery: {Math.round(robot.battery)}%)
                </option>
              ))}
            </select>
            {availableRobots.length === 0 && (
              <p className="text-sm text-red-400 mt-1">No idle robots available</p>
            )}
          </div>

          {/* Stops Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Delivery Stops</label>
              <span className="text-xs text-muted-foreground">
                {selectedStops.length}/4
              </span>
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
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <select
                    value={availableLocations.findIndex(loc => 
                      loc.lat === stop.lat && loc.lng === stop.lng
                    )}
                    onChange={(e) => updateStop(index, availableLocations[parseInt(e.target.value)])}
                    className="flex-1 p-2 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  >
                    {availableLocations.map((location, locIndex) => (
                      <option key={locIndex} value={locIndex}>
                        {location.address}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeStop(index)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {selectedStops.length < 4 && (
              <button
                type="button"
                onClick={addStop}
                className="w-full p-2 border border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Stop
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !selectedRobot || selectedStops.length === 0}
            className="w-full p-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Create Delivery
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
