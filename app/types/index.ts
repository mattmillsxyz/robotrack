export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Delivery {
  id: string;
  stops: Location[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  estimatedCompletion?: Date;
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
