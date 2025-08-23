'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Robot, Location } from '../types';
import { Package, MapPin, Zap, Wrench, WifiOff } from 'lucide-react';

interface RobotMapInnerProps {
  robots: Robot[];
  selectedRobot?: Robot;
  onRobotClick: (robot: Robot) => void;
}

// Component to handle map updates when robots change
function MapUpdater({ robots, selectedRobot, onRobotClick }: RobotMapInnerProps) {
  const map = useMap();

  // Only focus on selected robot, no auto-fitting bounds
  useEffect(() => {
    if (selectedRobot) {
      map.setView([selectedRobot.location.lat, selectedRobot.location.lng], 15);
    }
  }, [selectedRobot, map]);

  return null;
}

// Component to create robot markers
function RobotMarkers({ robots, onRobotClick }: { robots: Robot[]; onRobotClick: (robot: Robot) => void }) {
  const prevPositions = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  const createRobotIcon = (status: Robot['status'], robotId: string) => {
    const getIconColor = () => {
      switch (status) {
        case 'idle': return '#00ff00';
        case 'delivering': return '#00ff00';
        case 'charging': return '#f59e0b';
        case 'maintenance': return '#f97316';
        case 'offline': return '#ef4444';
        default: return '#6b7280';
      }
    };

    // Calculate rotation based on movement direction
    const prevPos = prevPositions.current.get(robotId);
    let rotation = 0;
    
    if (prevPos) {
      const robot = robots.find(r => r.id === robotId);
      if (robot) {
        const dx = robot.location.lng - prevPos.lng;
        const dy = robot.location.lat - prevPos.lat;
        if (Math.abs(dx) > 0.00001 || Math.abs(dy) > 0.00001) {
          rotation = Math.atan2(dy, dx) * 180 / Math.PI;
        }
      }
    }

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

  const createChargingStationIcon = () => {
    return L.divIcon({
      className: 'charging-station-icon',
      html: `
        <div style="
          width: 16px;
          height: 16px;
          background: #f59e0b;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  const getStatusIcon = (status: Robot['status']) => {
    switch (status) {
      case 'idle': return '🟢';
      case 'delivering': return '🟢';
      case 'charging': return '🟡';
      case 'maintenance': return '🟠';
      case 'offline': return '🔴';
      default: return '⚪';
    }
  };

  // Update previous positions
  useEffect(() => {
    robots.forEach(robot => {
      prevPositions.current.set(robot.id, { lat: robot.location.lat, lng: robot.location.lng });
    });
  }, [robots]);

  // Get charging stations from simulation
  const [chargingStations, setChargingStations] = useState<Location[]>([]);

  useEffect(() => {
    // Fetch charging stations
    fetch('/api/charging-stations')
      .then(res => res.json())
      .then((stations: Location[]) => setChargingStations(stations))
      .catch(() => setChargingStations([]));
  }, []);

  return (
    <>
      {/* Robot markers */}
      {robots.map((robot) => (
        <Marker
          key={robot.id}
          position={[robot.location.lat, robot.location.lng]}
          icon={createRobotIcon(robot.status, robot.id)}
          eventHandlers={{
            click: () => onRobotClick(robot),
          }}
        >
          <Popup>
            <div style={{ minWidth: '200px', padding: '8px', background: '#000', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span>{getStatusIcon(robot.status)}</span>
                <strong style={{ fontSize: '14px' }}>{robot.name}</strong>
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#888' }}>Status:</span>
                  <span style={{ 
                    color: robot.status === 'idle' ? '#00ff00' : 
                           robot.status === 'delivering' ? '#00ff00' : 
                           robot.status === 'charging' ? '#f59e0b' : 
                           robot.status === 'maintenance' ? '#f97316' : '#ef4444' 
                  }}>
                    {robot.status.charAt(0).toUpperCase() + robot.status.slice(1)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#888' }}>Battery:</span>
                  <span>{Math.round(robot.battery)}%</span>
                </div>
                {robot.status === 'delivering' && robot.speed > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#888' }}>Speed:</span>
                    <span>{robot.speed.toFixed(1)} km/h</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#888' }}>Location:</span>
                  <span style={{ fontSize: '11px' }}>{robot.location.address}</span>
                </div>
                {robot.currentDelivery && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px', 
                    background: 'rgba(0, 255, 0, 0.1)', 
                    border: '1px solid rgba(0, 255, 0, 0.2)', 
                    borderRadius: '4px' 
                  }}>
                    <div style={{ fontSize: '11px', color: '#00ff00', fontWeight: '500' }}>Current Delivery</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{robot.currentDelivery.stops.length} stops remaining</div>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Charging station markers */}
      {chargingStations.map((station, index) => (
        <Marker
          key={`charging-${index}`}
          position={[station.lat, station.lng]}
          icon={createChargingStationIcon()}
        >
          <Popup>
            <div style={{ minWidth: '150px', padding: '8px', background: '#000', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span>⚡</span>
                <strong style={{ fontSize: '14px' }}>Charging Station</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#888' }}>
                {station.address}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function RobotMapInner({ robots, selectedRobot, onRobotClick }: RobotMapInnerProps) {
  const [isMapReady, setIsMapReady] = useState(false);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-800 bg-gray-900 relative">
      <MapContainer
        center={[30.2672, -97.7431]} // Austin, Texas
        zoom={13} // Closer zoom for Austin area
        style={{ height: '100%', width: '100%' }}
        className="z-10"
        whenReady={() => setIsMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <RobotMarkers robots={robots} onRobotClick={onRobotClick} />
        <MapUpdater robots={robots} selectedRobot={selectedRobot} onRobotClick={onRobotClick} />
      </MapContainer>
      
      
      {/* Status breakdown */}
      <div 
        className="absolute top-0 right-0 pointer-events-none z-50 text-xs text-green-500 bg-black/50 px-2 py-1"
        style={{ fontSize: '10px' }}
      >
        Idle: {robots.filter(r => r.status === 'idle').length} | 
        Delivering: {robots.filter(r => r.status === 'delivering').length} | 
        Charging: {robots.filter(r => r.status === 'charging').length}
      </div>
    </div>
  );
}
