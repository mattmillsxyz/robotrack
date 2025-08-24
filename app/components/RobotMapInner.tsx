'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Robot } from '../types';
import { SAMPLE_LOCATIONS, CHARGING_STATIONS } from '../lib/locations';
import { getStatusIcon } from '../lib/utils';

interface RobotMapInnerProps {
  robots: Robot[];
  selectedRobot?: Robot;
  onRobotClick: (robot: Robot) => void;
}

// Component to handle map updates when robots change
function MapUpdater({ selectedRobot }: { selectedRobot?: Robot }) {
  // Removed automatic map movement - map should stay where user positioned it
  return null;
}

// Component to handle routing for robots
function RobotRouting({ robots }: { robots: Robot[] }) {
  const map = useMap();
  const routeRefs = useRef<Map<string, L.Polyline>>(new Map());
  
  useEffect(() => {
    // Clear existing routes
    routeRefs.current.forEach((polyline) => {
      map.removeLayer(polyline);
    });
    routeRefs.current.clear();

    // Show routes for all delivering robots
    robots.forEach((robot) => {
      if (robot.status === 'delivering' && robot.currentDelivery) {
        // Use route journey if available, otherwise fall back to current route
        if (robot.routeJourney && robot.currentSegmentIndex !== undefined) {
          // Display the full route journey
          robot.routeJourney.forEach((segment, index) => {
            const validCoordinates = segment.route.coordinates.filter(coord => 
              coord && coord.length === 2 && 
              typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
              Math.abs(coord[0]) > 0.1 || Math.abs(coord[1]) > 0.1
            );
            
            if (validCoordinates.length >= 2) {
              const routeCoordinates = validCoordinates.map(coord => L.latLng(coord[1], coord[0]));
              const color = segment.type === 'charging' ? '#ff8c00' : robot.color; // Use robot color for delivery routes
              const polyline = L.polyline(routeCoordinates, { 
                color: color, 
                opacity: 0.6, 
                weight: 3 
              }).addTo(map);
              
              const routeKey = `${robot.id}-segment-${index}`;
              routeRefs.current.set(routeKey, polyline);
            }
          });
        } else if (robot.currentRoute) {
          // Legacy: display single route
          const validCoordinates = robot.currentRoute.coordinates.filter(coord => 
            coord && coord.length === 2 && 
            typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
            Math.abs(coord[0]) > 0.1 || Math.abs(coord[1]) > 0.1
          );
          
          if (validCoordinates.length >= 2) {
            const routeCoordinates = validCoordinates.map(coord => L.latLng(coord[1], coord[0]));
            const polyline = L.polyline(routeCoordinates, { 
              color: robot.color, // Use robot color
              opacity: 0.6, 
              weight: 3 
            }).addTo(map);
            
            routeRefs.current.set(robot.id, polyline);
          }
        }
      }
    });

    return () => {
      routeRefs.current.forEach((polyline) => {
        map.removeLayer(polyline);
      });
      routeRefs.current.clear();
    };
  }, [robots]); // Depend on robots array instead of selected robot

  return null;
}

// Component to display location markers
function LocationMarkers({ robots }: { robots: Robot[] }) {
  const map = useMap();
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const staticMarkersCreated = useRef(false);
  
  useEffect(() => {
    // Only create static markers (charging stations and sample locations) once
    if (!staticMarkersCreated.current) {   
      // Always add markers for all charging stations from the simulation
      CHARGING_STATIONS.forEach((station) => {
        const locationKey = `charging-${station.lat},${station.lng}`;
        const marker = L.marker([station.lat, station.lng], {
          icon: L.divIcon({
            className: 'charging-marker',
            html: `<div style="width: 12px; height: 12px; background: #ff8c00; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          }),
        }).addTo(map);
        
        // Add hover tooltip
        marker.bindTooltip(station.address, {
          permanent: false,
          direction: 'top',
          className: 'marker-tooltip'
        });
        
        markerRefs.current.set(locationKey, marker);
      });

      SAMPLE_LOCATIONS.forEach((location) => {
        const locationKey = `sample-${location.lat},${location.lng}`;
        const marker = L.marker([location.lat, location.lng], {
          icon: L.divIcon({
            className: 'sample-marker',
            html: `<div style="width: 12px; height: 12px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          }),
        }).addTo(map);
        
        // Add hover tooltip
        marker.bindTooltip(location.address, {
          permanent: false,
          direction: 'top',
          className: 'marker-tooltip'
        });
        
        markerRefs.current.set(locationKey, marker);
      });
      
      staticMarkersCreated.current = true;
    }

    // Clear existing delivery markers
    const deliveryMarkerKeys = Array.from(markerRefs.current.keys()).filter(key => key.startsWith('delivery-'));
    deliveryMarkerKeys.forEach(key => {
      const marker = markerRefs.current.get(key);
      if (marker) {
        map.removeLayer(marker);
        markerRefs.current.delete(key);
      }
    });

    // Add markers for delivery locations from current deliveries
    robots.forEach((robot) => {
      if (robot.currentDelivery) {
        robot.currentDelivery.stops.forEach((stop) => {
          const locationKey = `delivery-${stop.lat},${stop.lng}`;
          if (!markerRefs.current.has(locationKey)) {
            const marker = L.marker([stop.lat, stop.lng], {
              icon: L.divIcon({
                className: 'delivery-marker',
                html: `<div style="width: 12px; height: 12px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              }),
            }).addTo(map);
            markerRefs.current.set(locationKey, marker);
          }
        });
      }
    });

    return () => {
      // Only cleanup on unmount, not on every robots update
    };
  }, [map]); // Only depend on map, not robots

  // Separate effect for delivery markers that updates with robots
  useEffect(() => {
    // Clear existing delivery markers
    const deliveryMarkerKeys = Array.from(markerRefs.current.keys()).filter(key => key.startsWith('delivery-'));
    deliveryMarkerKeys.forEach(key => {
      const marker = markerRefs.current.get(key);
      if (marker) {
        map.removeLayer(marker);
        markerRefs.current.delete(key);
      }
    });

    // Add markers for delivery locations from current deliveries
    robots.forEach((robot) => {
      if (robot.currentDelivery) {
        robot.currentDelivery.stops.forEach((stop) => {
          const locationKey = `delivery-${stop.lat},${stop.lng}`;
          if (!markerRefs.current.has(locationKey)) {
            const marker = L.marker([stop.lat, stop.lng], {
              icon: L.divIcon({
                className: 'delivery-marker',
                html: `<div style="width: 12px; height: 12px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              }),
            }).addTo(map);
            markerRefs.current.set(locationKey, marker);
          }
        });
      }
    });
  }, [robots, map]);

  return null;
}

// Component to create robot markers
function RobotMarkers({ robots, onRobotClick }: { robots: Robot[]; onRobotClick: (robot: Robot) => void }) {
  // const prevPositions = useRef<Map<string, { lat: number; lng: number }>>(new Map()); // Unused variable

  const createRobotIcon = (robot: Robot) => {
    const getIconColor = () => {
      // Use robot's color for the main marker, with status-based accent
      return robot.color;
    };

    return L.divIcon({
      className: 'custom-robot-icon',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: ${getIconColor()};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };



  return (
    <>
      {/* Robot markers */}
      {robots.map((robot) => (
        <Marker
          key={robot.id}
          position={[robot.location.lat, robot.location.lng]}
          icon={createRobotIcon(robot)}
          eventHandlers={{
            click: () => onRobotClick(robot),
            mouseover: (e) => {
              e.target.openPopup();
            },
            mouseout: (e) => {
              e.target.closePopup();
            },
          }}
        >
          <Popup>
            <div className="min-w-[200px] text-foreground rounded-lg shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon(robot.status)}
                <strong className="text-sm font-medium">{robot.name}</strong>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Status:</span>
                  <span className={
                    robot.status === 'idle' ? 'text-primary' : 
                    robot.status === 'delivering' ? 'text-success' : 
                    robot.status === 'charging' ? 'text-warning' : 
                    robot.status === 'maintenance' ? 'text-warning' : 'text-danger'
                  }>
                    {robot.status.charAt(0).toUpperCase() + robot.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/60">Battery:</span>
                  <span className={
                    robot.battery > 50 ? 'text-success' :
                    robot.battery > 20 ? 'text-warning' : 'text-danger'
                  }>
                    {Math.round(robot.battery)}%
                  </span>
                </div>
                {robot.status === 'delivering' && robot.speed > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/60">Speed:</span>
                    <span className="text-primary">{robot.speed.toFixed(1)} km/h</span>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="text-foreground/60">Location:</span>
                  <span className="text-[11px] text-right max-w-[120px] truncate">{robot.location.address}</span>
                </div>
                {robot.currentDelivery && (
                  <div className="mt-3 p-2 bg-content1 rounded-md">
                    <div className="text-[11px] text-success font-medium">Current Delivery</div>
                    <div className="text-[11px] text-foreground/60">{robot.currentDelivery.stops.length} stops remaining</div>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function RobotMapInner({ robots, selectedRobot, onRobotClick }: RobotMapInnerProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-600/10 relative">
      <MapContainer
        center={[30.2672, -97.7431]} // Austin, Texas
        zoom={15} // Closer zoom for central Austin
        style={{ height: '100%', width: '100%' }}
        className="z-10"
        whenReady={() => {}}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <RobotMarkers robots={robots} onRobotClick={onRobotClick} />
        <RobotRouting robots={robots} />
        <LocationMarkers robots={robots} />
        <MapUpdater selectedRobot={selectedRobot} />
      </MapContainer>
      
      {/* Status breakdown */}
      <div 
        className="absolute top-2 right-2 pointer-events-none z-50 text-xs text-green-500 bg-black/50 px-2 py-1 rounded-md"
        style={{ fontSize: '10px' }}
      >
        Idle: {robots.filter(r => r.status === 'idle').length} | 
        Delivering: {robots.filter(r => r.status === 'delivering').length} | 
        Charging: {robots.filter(r => r.status === 'charging').length}
      </div>
    </div>
  );
}
