export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Route {
  coordinates: [number, number][]; // [lng, lat] pairs
  distance: number;
  duration: number;
}

export interface RouteSegment {
  from: Location;
  to: Location;
  route: Route;
  type: 'delivery' | 'charging';
}

export interface Delivery {
  id: string;
  stops: Location[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  estimatedCompletion?: Date;
  route?: Route; // Optional route information
  robotId: string;
}

export interface Robot {
  id: string;
  name: string;
  status: 'idle' | 'delivering' | 'charging' | 'maintenance' | 'offline';
  battery: number;
  location: Location;
  currentDelivery?: Delivery;
  deliveries: Delivery[];
  speed: number; // km/h
  lastUpdate: Date;
  currentRoute?: Route; // Current route being followed (legacy)
  routeProgress?: number; // Progress along current route (0-1) (legacy)
  routeJourney?: RouteSegment[]; // Full journey as array of route segments
  currentSegmentIndex?: number; // Current segment being followed
  color: string; // Robot's unique color for UI
  isUnloading?: boolean; // Whether robot is currently unloading at a stop
  unloadingTime?: number; // Remaining unloading time in milliseconds
}

export interface RobotUpdate {
  robotId: string;
  location: Location;
  status: Robot['status'];
  battery: number;
  speed: number;
}

export interface DeliveryRequest {
  robotId: string;
  stops: Location[];
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
