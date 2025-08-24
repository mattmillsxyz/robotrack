import { Robot, Location, Delivery, Route, RouteSegment } from '../types';
import { v4 as uuidv4 } from 'uuid'; // Still needed for delivery IDs
import { SAMPLE_LOCATIONS, CHARGING_STATIONS } from './locations';
import { PersistenceManager } from './persistence';



const ROBOT_NAMES = [
  'BOT-001',
  'BOT-002',
  'BOT-003',
  'BOT-004',
  'BOT-005',
  'BOT-006',
  'BOT-007',
  'BOT-008'
];

// Static robot IDs that don't change on server restart
const ROBOT_IDS = [
  'robot-001',
  'robot-002',
  'robot-003',
  'robot-004',
  'robot-005',
  'robot-006',
  'robot-007',
  'robot-008'
];

// Robot colors for UI consistency
const ROBOT_COLORS = [
  '#22c55e', // Green
  '#f59e0b', // Yellow
  '#8b5cf6', // Purple
  '#0891b2', // Teal
  '#f472b6', // Pink
  '#10b981', // Emerald
  '#d946ef', // Fuchsia
  '#0ea5e9', // Sky
];

interface RoutePoint {
  lat: number;
  lng: number;
  progress: number; // 0 to 1 along the route
}

interface RobotRoute {
  points: RoutePoint[];
  currentPointIndex: number;
  progress: number; // 0 to 1 between current and next point
  totalDistance: number;
  currentDistance: number;
}

class RobotSimulation {
  private robots: Map<string, Robot> = new Map();
  private simulationInterval: NodeJS.Timeout | null = null;
  private io: unknown = null;
  private robotRoutes: Map<string, RobotRoute> = new Map();

  constructor() {
    this.initializeRobots();
  }

  async initializeFromPersistence() {
    try {
      // Load robots from persistence
      const savedRobots = await PersistenceManager.loadRobots();
      if (savedRobots.length > 0) {
        this.robots = new Map(savedRobots.map(robot => [robot.id, robot]));
        console.log(`Loaded ${savedRobots.length} robots from persistence`);
        return;
      }
      
      // If no saved robots, initialize fresh
      this.initializeRobots();
    } catch (error) {
      console.error('Failed to load from persistence, initializing fresh:', error);
      this.initializeRobots();
    }
  }

  resetSimulation() {
    console.log('Resetting simulation...');
    this.stopSimulation();
    this.robots.clear();
    this.robotRoutes.clear();
    this.initializeRobots();
    console.log('Simulation reset complete');
  }

  setIO(io: unknown) {
    this.io = io;
  }

  private initializeRobots() {
    // Use different locations for each robot to avoid clustering
    const usedLocations = new Set<number>();
    
    ROBOT_NAMES.forEach((name, index) => {
      let locationIndex;
      do {
        locationIndex = Math.floor(Math.random() * SAMPLE_LOCATIONS.length);
      } while (usedLocations.has(locationIndex));
      
      usedLocations.add(locationIndex);
      const randomLocation = SAMPLE_LOCATIONS[locationIndex];
      
      // Start all robots as idle with full battery
      const robot: Robot = {
        id: ROBOT_IDS[index], // Use static ID instead of uuidv4()
        name,
        status: 'idle',
        battery: 100, // Start with full battery
        location: { ...randomLocation },
        deliveries: [],
        speed: 0,
        lastUpdate: new Date(),
        color: ROBOT_COLORS[index], // Assign robot color
        isUnloading: false,
        unloadingTime: 0,
      };
      
      this.robots.set(robot.id, robot);
    });
  }

  async startSimulation() {
    if (this.simulationInterval) {
      console.log('Simulation already running');
      return;
    }

    console.log('Starting robot simulation...');
    
    // Initialize from persistence if not already done
    await this.initializeFromPersistence();
    
    this.simulationInterval = setInterval(async () => {
      await this.updateRobots();
    }, 200); // Update every 200ms for smooth movement like Uber
    console.log('Robot simulation started successfully');
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private async updateRobots() {
    const statusBreakdown = { idle: 0, delivering: 0, charging: 0, maintenance: 0, offline: 0 };

    for (const robot of this.robots.values()) {
      // Update battery based on status
      if (robot.status === 'delivering') {
        // Very slow battery drain during delivery (should last all day)
        robot.battery = Math.max(0, robot.battery - 0.000001); // Much slower drain
      } else if (robot.status === 'charging') {
        // Fast charging when at charging station
        robot.battery = Math.min(100, robot.battery + 10);
      } else {
        // Very slow drain when idle
        robot.battery = Math.max(0, robot.battery - 0.00000001); // 0.02% per update (very slow)
      }

      // Update robot status based on battery and current state
      if (robot.status === 'delivering' && robot.battery < 15) {
        // Only go to charging if battery is critically low during delivery
        this.sendToNearestChargingStation(robot);
      } else if (robot.status === 'idle' && robot.battery < 20) {
        // Go to charging when idle and battery is low (lower threshold)
        this.sendToNearestChargingStation(robot);
      } else if (robot.status === 'charging' && robot.battery >= 95) {
        // Stop charging when nearly full
        robot.status = 'idle';
        robot.speed = 0;
        console.log(`${robot.name} finished charging, now idle`);
      }

      // Update location if robot is moving
      if (robot.status === 'delivering' && robot.currentDelivery) {
        await this.updateRobotLocationWithRoute(robot);
      } else if (robot.status === 'charging') {
        // Move towards charging station if not there yet
        this.moveTowardsChargingStation(robot);
      }

      // Update speed and last update time
      // Use consistent speed based on status
      if (robot.status === 'delivering') {
        robot.speed = 12; // Consistent 12 km/h for deliveries
      } else if (robot.status === 'charging') {
        robot.speed = 5; // Slower speed when going to charge
      } else {
        robot.speed = 0; // No movement when idle
      }
      robot.lastUpdate = new Date();

      statusBreakdown[robot.status]++;
    }

    // Save robots to persistence periodically
    try {
      await PersistenceManager.saveRobots(Array.from(this.robots.values()));
    } catch (error) {
      console.error('Failed to save robots to persistence:', error);
    }
  }

  private async calculateRoute(from: Location, to: Location): Promise<RoutePoint[]> {
    console.log(`Calculating route from ${from.address} to ${to.address}`);
    
    // Use fallback routing for now - more reliable than external OSRM
    console.log('Using fallback routing with street simulation');
    return this.createFallbackRoute(from, to);
  }

  private createFallbackRoute(from: Location, to: Location): RoutePoint[] {
    const points: RoutePoint[] = [];
    const numPoints = 50; // More points for smoother movement
    
    console.log(`Creating fallback route with ${numPoints} points`);
    
    // Create a more realistic route that follows major streets
    // Add intermediate waypoints to simulate street routing
    const intermediatePoints = this.getIntermediateWaypoints(from, to);
    
    // Build route through intermediate points
    let currentFrom = from;
    let totalProgress = 0;
    
    for (const waypoint of intermediatePoints) {
      // Add points from current position to waypoint
      for (let i = 0; i <= 10; i++) {
        const progress = i / 10;
        const lat = currentFrom.lat + (waypoint.lat - currentFrom.lat) * progress;
        const lng = currentFrom.lng + (waypoint.lng - currentFrom.lng) * progress;
        
        points.push({
          lat,
          lng,
          progress: totalProgress
        });
        totalProgress += 1 / (intermediatePoints.length + 1) / 11; // 11 points per segment
      }
      currentFrom = waypoint;
    }
    
    // Add final segment to destination
    for (let i = 0; i <= 10; i++) {
      const progress = i / 10;
      const lat = currentFrom.lat + (to.lat - currentFrom.lat) * progress;
      const lng = currentFrom.lng + (to.lng - currentFrom.lng) * progress;
      
      points.push({
        lat,
        lng,
        progress: totalProgress
      });
      totalProgress += 1 / (intermediatePoints.length + 1) / 11;
    }
    
    // Normalize progress values
    points.forEach((point, index) => {
      point.progress = index / (points.length - 1);
    });
    
    console.log(`Fallback route created: ${points.length} points`);
    return points;
  }

  private getIntermediateWaypoints(from: Location, to: Location): Location[] {
    // Create intermediate waypoints to simulate street routing
    const waypoints: Location[] = [];
    
    // Find 2-4 intermediate points along the route for more realistic paths
    const numWaypoints = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 1; i <= numWaypoints; i++) {
      const progress = i / (numWaypoints + 1);
      
      // Add some randomness to simulate street curves
      const baseLat = from.lat + (to.lat - from.lat) * progress;
      const baseLng = from.lng + (to.lng - from.lng) * progress;
      
      // Add larger random offset to simulate street routing (more pronounced curves)
      const latOffset = (Math.random() - 0.5) * 0.005;
      const lngOffset = (Math.random() - 0.5) * 0.005;
      
      waypoints.push({
        lat: baseLat + latOffset,
        lng: baseLng + lngOffset,
        address: `Waypoint ${i}`
      });
    }
    
    return waypoints;
  }

  private moveTowardsChargingStation(robot: Robot) {
    // Find the nearest charging station
    const nearestStation = this.findNearestChargingStation(robot.location);
    if (!nearestStation) return;

    // Simple movement towards charging station
    const latDiff = nearestStation.lat - robot.location.lat;
    const lngDiff = nearestStation.lng - robot.location.lng;
    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    
    if (distance < 0.001) {
      // Arrived at charging station
      robot.location = { ...nearestStation };
      robot.speed = 0;
    } else {
      // Move towards charging station
      const moveSpeed = 0.0001;
      const latMove = (latDiff / distance) * moveSpeed;
      const lngMove = (lngDiff / distance) * moveSpeed;
      
      robot.location.lat += latMove;
      robot.location.lng += lngMove;
      // Speed is now handled in the main update loop
    }
  }

  public findNearestChargingStation(location: Location): Location | null {
    let nearest: Location | null = null;
    let minDistance = Infinity;
    
    for (const station of this.getChargingStations()) {
      const distance = Math.sqrt(
        Math.pow(station.lat - location.lat, 2) + 
        Math.pow(station.lng - location.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    }
    
    return nearest;
  }

  private async updateRobotLocationWithRoute(robot: Robot) {
    // Use route journey if available, otherwise fall back to legacy single route
    if (robot.routeJourney && robot.currentSegmentIndex !== undefined) {
      await this.updateRobotLocationWithRouteJourney(robot);
    } else if (robot.currentRoute && robot.routeProgress !== undefined) {
      await this.updateRobotLocationWithLegacyRoute(robot);
    }
  }

  private async updateRobotLocationWithRouteJourney(robot: Robot) {
    if (!robot.currentDelivery || !robot.routeJourney || robot.currentSegmentIndex === undefined) return;
    
    const currentSegment = robot.routeJourney[robot.currentSegmentIndex];
    if (!currentSegment) return;

    // Check if robot is unloading (paused at stop)
    if (robot.isUnloading) {
      const unloadingTime = robot.unloadingTime || 0;
      robot.unloadingTime = unloadingTime - 200; // 200ms per update
      if (robot.unloadingTime <= 0) {
        robot.isUnloading = false;
        robot.unloadingTime = 0;
        console.log(`${robot.name} finished unloading, continuing to next stop`);
      }
      return; // Don't move while unloading
    }

    // Update the current delivery's first stop to reflect the current target
    if (robot.currentDelivery.stops.length > 0) {
      robot.currentDelivery.stops[0] = currentSegment.to;
    }

    console.log(`${robot.name} following route journey segment ${robot.currentSegmentIndex + 1}/${robot.routeJourney.length}, target: ${currentSegment.to.address}, progress: ${robot.routeProgress?.toFixed(3) || 0}`);
    
    // Initialize route progress if not set
    if (robot.routeProgress === undefined) {
      robot.routeProgress = 0;
    }
    
    // Validate route coordinates
    const validCoordinates = currentSegment.route.coordinates.filter(coord => 
      coord && coord.length === 2 && 
      typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
      Math.abs(coord[0]) > 0.1 || Math.abs(coord[1]) > 0.1
    );
    
    if (validCoordinates.length < 2) {
      console.warn(`${robot.name} has invalid route coordinates, skipping movement`);
      return;
    }
    
    // Calculate movement speed based on robot speed and route distance
    // Robot speed is 12 km/h = 12,000 m/h = 200 m/min = 3.33 m/s
    // With 200ms updates, that's 0.67 meters per update
    const robotSpeedMps = robot.speed / 3.6; // Convert km/h to m/s
    const routeDistanceM = currentSegment.route.distance; // Distance in meters
    const timeToComplete = routeDistanceM / robotSpeedMps; // Time in seconds
    const updatesToComplete = timeToComplete * 5; // 5 updates per second (200ms intervals)
    const movementSpeed = 1 / updatesToComplete; // Progress per update
    
    robot.routeProgress += movementSpeed;
    
    if (robot.routeProgress >= 1) {
      // Arrived at destination for this segment
      console.log(`${robot.name} completed segment ${robot.currentSegmentIndex + 1}: ${currentSegment.to.address}`);
      
      // Start unloading simulation (pause for 3-5 seconds)
      const unloadingDuration = Math.random() * 2000 + 3000; // 3-5 seconds
      robot.isUnloading = true;
      robot.unloadingTime = unloadingDuration;
      console.log(`${robot.name} arrived at stop, unloading for ${(unloadingDuration/1000).toFixed(1)} seconds`);
      
      // Remove the completed stop from the delivery
      if (robot.currentDelivery.stops.length > 0) {
        robot.currentDelivery.stops.shift();
        console.log(`${robot.name} removed completed stop, ${robot.currentDelivery.stops.length} stops remaining`);
      }
      
      // Move to next segment
      robot.currentSegmentIndex++;
      robot.routeProgress = 0;
      
      if (robot.currentSegmentIndex >= robot.routeJourney.length) {
        // Completed entire journey
        console.log(`${robot.name} completed entire route journey with battery at ${robot.battery.toFixed(2)}%`);
        robot.currentDelivery.status = 'completed';
        robot.status = 'idle';
        
        // Update delivery status in persistence
        try {
          await PersistenceManager.updateDelivery(robot.currentDelivery.id, 'completed');
        } catch (error) {
          console.error('Failed to update delivery status in persistence:', error);
        }
        
        robot.currentDelivery = undefined; // Clear the current delivery reference
        robot.routeJourney = undefined;
        robot.currentSegmentIndex = undefined;
        robot.routeProgress = undefined;
        robot.isUnloading = false;
        robot.unloadingTime = 0;
      } else {
        // Start next segment
        const nextSegment = robot.routeJourney[robot.currentSegmentIndex];
        console.log(`${robot.name} starting segment ${robot.currentSegmentIndex + 1}: ${nextSegment.to.address}`);
      }
      return;
    }
    
    // Interpolate position along the current route segment
    const routeCoordinates = currentSegment.route.coordinates;
    const totalPoints = routeCoordinates.length;
    const currentIndex = Math.floor(robot.routeProgress * (totalPoints - 1));
    const nextIndex = Math.min(currentIndex + 1, totalPoints - 1);
    
    const currentCoord = routeCoordinates[currentIndex];
    const nextCoord = routeCoordinates[nextIndex];
    
    if (currentCoord && nextCoord) {
      const segmentProgress = (robot.routeProgress * (totalPoints - 1)) - currentIndex;
      const oldLat = robot.location.lat;
      const oldLng = robot.location.lng;
      
      // Update robot position
      robot.location.lng = currentCoord[0] + (nextCoord[0] - currentCoord[0]) * segmentProgress;
      robot.location.lat = currentCoord[1] + (nextCoord[1] - currentCoord[1]) * segmentProgress;
      
      const latDiff = Math.abs(robot.location.lat - oldLat);
      const lngDiff = Math.abs(robot.location.lng - oldLng);
      
      if (latDiff > 0.000001 || lngDiff > 0.000001) {
        console.log(`${robot.name} moved along route: lat ${latDiff.toFixed(6)}, lng ${lngDiff.toFixed(6)}`);
      }
    }
  }

  private async updateRobotLocationWithLegacyRoute(robot: Robot) {
    // Legacy method for backward compatibility
    if (!robot.currentDelivery || robot.currentDelivery.stops.length === 0) return;
    if (!robot.currentRoute || robot.routeProgress === undefined) return;

    // Check if robot is unloading (paused at stop)
    if (robot.isUnloading) {
      const unloadingTime = robot.unloadingTime || 0;
      robot.unloadingTime = unloadingTime - 200; // 200ms per update
      if (robot.unloadingTime <= 0) {
        robot.isUnloading = false;
        robot.unloadingTime = 0;
        console.log(`${robot.name} finished unloading, continuing to next stop`);
      }
      return; // Don't move while unloading
    }

    const currentStop = robot.currentDelivery.stops[0];
    console.log(`${robot.name} following legacy route, target: ${currentStop.address}, progress: ${robot.routeProgress.toFixed(3)}`);
    
    // Calculate movement speed based on robot speed and route distance
    const robotSpeedMps = robot.speed / 3.6; // Convert km/h to m/s
    const routeDistanceM = robot.currentRoute.distance; // Distance in meters
    const timeToComplete = routeDistanceM / robotSpeedMps; // Time in seconds
    const updatesToComplete = timeToComplete * 5; // 5 updates per second (200ms intervals)
    const movementSpeed = 1 / updatesToComplete; // Progress per update
    
    robot.routeProgress += movementSpeed;
    
    if (robot.routeProgress >= 1) {
      // Arrived at destination
      console.log(`${robot.name} arrived at destination: ${currentStop.address}`);
      
      // Start unloading simulation (pause for 3-5 seconds)
      const unloadingDuration = Math.random() * 2000 + 3000; // 3-5 seconds
      robot.isUnloading = true;
      robot.unloadingTime = unloadingDuration;
      console.log(`${robot.name} arrived at stop, unloading for ${(unloadingDuration/1000).toFixed(1)} seconds`);
      
      robot.currentDelivery.stops.shift();
      robot.routeProgress = 0;
      
      if (robot.currentDelivery.stops.length === 0) {
        robot.currentDelivery.status = 'completed';
        robot.status = 'idle';
        
        // Update delivery status in persistence
        try {
          await PersistenceManager.updateDelivery(robot.currentDelivery.id, 'completed');
        } catch (error) {
          console.error('Failed to update delivery status in persistence:', error);
        }
        
        robot.currentDelivery = undefined;
        robot.currentRoute = undefined;
        robot.isUnloading = false;
        robot.unloadingTime = 0;
        console.log(`${robot.name} completed delivery with battery at ${robot.battery.toFixed(2)}%`);
      }
      return;
    }
    
    // Interpolate position along the route
    const routeCoordinates = robot.currentRoute.coordinates;
    const totalPoints = routeCoordinates.length;
    const currentIndex = Math.floor(robot.routeProgress * (totalPoints - 1));
    const nextIndex = Math.min(currentIndex + 1, totalPoints - 1);
    
    const currentCoord = routeCoordinates[currentIndex];
    const nextCoord = routeCoordinates[nextIndex];
    
    if (currentCoord && nextCoord) {
      const segmentProgress = (robot.routeProgress * (totalPoints - 1)) - currentIndex;
      const oldLat = robot.location.lat;
      const oldLng = robot.location.lng;
      
      // Update robot position
      robot.location.lng = currentCoord[0] + (nextCoord[0] - currentCoord[0]) * segmentProgress;
      robot.location.lat = currentCoord[1] + (nextCoord[1] - currentCoord[1]) * segmentProgress;
      
      const latDiff = Math.abs(robot.location.lat - oldLat);
      const lngDiff = Math.abs(robot.location.lng - oldLng);
      
      if (latDiff > 0.000001 || lngDiff > 0.000001) {
        console.log(`${robot.name} moved along legacy route: lat ${latDiff.toFixed(6)}, lng ${lngDiff.toFixed(6)}`);
      }
    }
  }

  private async updateRobotLocation(robot: Robot) {
    // Legacy method - keeping for fallback
    if (!robot.currentDelivery || robot.currentDelivery.stops.length === 0) return;

    const currentStop = robot.currentDelivery.stops[0];
    console.log(`${robot.name} updating location, target: ${currentStop.address}`);
    
    // Get or create route for this robot
    let route = this.robotRoutes.get(robot.id);
    if (!route) {
      console.log(`${robot.name} creating new route`);
      const routePoints = await this.calculateRoute(robot.location, currentStop);
      route = {
        points: routePoints,
        currentPointIndex: 0,
        progress: 0,
        totalDistance: this.calculateRouteDistance(routePoints),
        currentDistance: 0
      };
      this.robotRoutes.set(robot.id, route);
      console.log(`${robot.name} route created with ${routePoints.length} points`);
    }
    
    if (route.points.length === 0) {
      console.log(`${robot.name} no route points available`);
      return;
    }
    
    // Move along the route - faster movement
    const movementSpeed = 0.03; // Faster for visible movement
    const nextPoint = route.points[route.currentPointIndex + 1];
    
    console.log(`${robot.name} route progress: ${route.currentPointIndex}/${route.points.length}, progress: ${route.progress.toFixed(3)}`);
    
    if (!nextPoint) {
      // Arrived at destination
      console.log(`${robot.name} arrived at destination`);
      robot.currentDelivery.stops.shift();
      if (robot.currentDelivery.stops.length === 0) {
        robot.currentDelivery.status = 'completed';
        robot.status = 'idle';
        
        // Update delivery status in persistence
        try {
          await PersistenceManager.updateDelivery(robot.currentDelivery.id, 'completed');
        } catch (error) {
          console.error('Failed to update delivery status in persistence:', error);
        }
        
        robot.currentDelivery = undefined;
        this.robotRoutes.delete(robot.id);
        console.log(`${robot.name} completed delivery`);
      } else {
        // Calculate route to next stop
        const nextStop = robot.currentDelivery.stops[0];
        console.log(`${robot.name} calculating route to next stop: ${nextStop.address}`);
        this.calculateRoute(robot.location, nextStop).then(routePoints => {
          const newRoute = {
            points: routePoints,
            currentPointIndex: 0,
            progress: 0,
            totalDistance: this.calculateRouteDistance(routePoints),
            currentDistance: 0
          };
          this.robotRoutes.set(robot.id, newRoute);
          console.log(`${robot.name} new route created with ${routePoints.length} points`);
        });
      }
      return;
    }
    
    // Update progress between current and next point
    const oldProgress = route.progress;
    route.progress += movementSpeed;
    
    console.log(`${robot.name} progress: ${oldProgress.toFixed(3)} -> ${route.progress.toFixed(3)}`);
    
    if (route.progress >= 1) {
      // Move to next point
      route.currentPointIndex++;
      route.progress = 0;
      console.log(`${robot.name} moved to next point: ${route.currentPointIndex}`);
      
      if (route.currentPointIndex >= route.points.length - 1) {
        // Arrived at destination
        console.log(`${robot.name} arrived at destination`);
        robot.currentDelivery.stops.shift();
        if (robot.currentDelivery.stops.length === 0) {
          robot.currentDelivery.status = 'completed';
          robot.status = 'idle';
          
          // Update delivery status in persistence
          try {
            await PersistenceManager.updateDelivery(robot.currentDelivery.id, 'completed');
          } catch (error) {
            console.error('Failed to update delivery status in persistence:', error);
          }
          
          robot.currentDelivery = undefined;
          this.robotRoutes.delete(robot.id);
          console.log(`${robot.name} completed delivery`);
        } else {
          // Calculate route to next stop
          const nextStop = robot.currentDelivery.stops[0];
          console.log(`${robot.name} calculating route to next stop: ${nextStop.address}`);
          this.calculateRoute(robot.location, nextStop).then(routePoints => {
            const newRoute = {
              points: routePoints,
              currentPointIndex: 0,
              progress: 0,
              totalDistance: this.calculateRouteDistance(routePoints),
              currentDistance: 0
            };
            this.robotRoutes.set(robot.id, newRoute);
            console.log(`${robot.name} new route created with ${routePoints.length} points`);
          });
        }
        return;
      }
    }
    
    // Interpolate position between current and next point
    const currentPoint2 = route.points[route.currentPointIndex];
    const nextPoint2 = route.points[route.currentPointIndex + 1];
    
    if (currentPoint2 && nextPoint2) {
      const oldLat = robot.location.lat;
      const oldLng = robot.location.lng;
      
      robot.location.lat = currentPoint2.lat + (nextPoint2.lat - currentPoint2.lat) * route.progress;
      robot.location.lng = currentPoint2.lng + (nextPoint2.lng - currentPoint2.lng) * route.progress;
      
      const latDiff = Math.abs(robot.location.lat - oldLat);
      const lngDiff = Math.abs(robot.location.lng - oldLng);
      
      if (latDiff > 0.000001 || lngDiff > 0.000001) {
        console.log(`${robot.name} moved: lat ${latDiff.toFixed(6)}, lng ${lngDiff.toFixed(6)}`);
      }
    }
  }

  private sendToNearestChargingStation(robot: Robot) {
    // Find nearest charging station
    let nearestStation = CHARGING_STATIONS[0];
    let minDistance = this.distance(robot.location, nearestStation);
    
    CHARGING_STATIONS.forEach(station => {
      const dist = this.distance(robot.location, station);
      if (dist < minDistance) {
        minDistance = dist;
        nearestStation = station;
      }
    });
    
    // Create a "delivery" to the charging station
    const chargingDelivery: Delivery = {
      id: uuidv4(),
      stops: [nearestStation],
      status: 'in_progress',
      createdAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 60000), // 1 minute
      robotId: robot.id,
    };
    
    robot.currentDelivery = chargingDelivery;
    robot.deliveries.push(chargingDelivery);
  }

  private distance(loc1: Location, loc2: Location): number {
    const dx = loc1.lat - loc2.lat;
    const dy = loc1.lng - loc2.lng;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateRouteDistance(points: RoutePoint[]): number {
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].lat - points[i-1].lat;
      const dy = points[i].lng - points[i-1].lng;
      distance += Math.sqrt(dx * dx + dy * dy);
    }
    return distance;
  }

  private assignRandomDelivery(robot: Robot) {
    const numStops = Math.floor(Math.random() * 3) + 2; // 2-4 stops
    const stops: Location[] = [];
    
    for (let i = 0; i < numStops; i++) {
      const randomLocation = SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)];
      stops.push({ ...randomLocation });
    }

    const delivery: Delivery = {
      id: uuidv4(),
      stops,
      status: 'in_progress',
      createdAt: new Date(),
      estimatedCompletion: new Date(Date.now() + Math.random() * 300000 + 60000), // 1-6 minutes
      robotId: robot.id,
    };

    robot.currentDelivery = delivery;
    robot.deliveries.push(delivery);
  }

  async createDelivery(robotId: string, stops: Location[]): Promise<Delivery | null> {
    const robot = this.robots.get(robotId);
    if (!robot || robot.status !== 'idle' || robot.battery < 90) return null; // Only if idle and fully charged

    const delivery: Delivery = {
      id: uuidv4(),
      stops: [...stops],
      status: 'in_progress',
      createdAt: new Date(),
      estimatedCompletion: new Date(Date.now() + Math.random() * 300000 + 60000),
      robotId: robotId,
    };

    robot.currentDelivery = delivery;
    robot.deliveries.push(delivery);
    robot.status = 'delivering';

    // Save delivery to history
    try {
      await PersistenceManager.addDelivery(delivery);
    } catch (error) {
      console.error('Failed to save delivery to history:', error);
    }

    return delivery;
  }

  async createDeliveryWithRoute(robotId: string, stops: Location[], route: Route): Promise<Delivery | null> {
    const robot = this.robots.get(robotId);
    if (!robot || robot.status !== 'idle' || robot.battery < 90) return null;

    const delivery: Delivery = {
      id: uuidv4(),
      stops: [...stops],
      status: 'in_progress',
      createdAt: new Date(),
      estimatedCompletion: new Date(Date.now() + route.duration * 1000), // Use actual route duration
      route: route,
      robotId: robotId,
    };

    robot.currentDelivery = delivery;
    robot.currentRoute = route;
    robot.routeProgress = 0;
    robot.deliveries.push(delivery);
    robot.status = 'delivering';

    // Save delivery to history
    try {
      await PersistenceManager.addDelivery(delivery);
    } catch (error) {
      console.error('Failed to save delivery to history:', error);
    }

    return delivery;
  }

  async createDeliveryWithRouteJourney(robotId: string, stops: Location[], routeJourney: RouteSegment[]): Promise<Delivery | null> {
    const robot = this.robots.get(robotId);
    if (!robot || robot.status !== 'idle' || robot.battery < 90) return null;

    const delivery: Delivery = {
      id: uuidv4(),
      stops: [...stops],
      status: 'in_progress',
      createdAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 300000), // 5 minutes estimate
      robotId: robotId,
    };

    robot.currentDelivery = delivery;
    robot.routeJourney = routeJourney;
    robot.currentSegmentIndex = 0;
    robot.routeProgress = 0;
    robot.deliveries.push(delivery);
    robot.status = 'delivering';

    // Save delivery to history
    try {
      await PersistenceManager.addDelivery(delivery);
    } catch (error) {
      console.error('Failed to save delivery to history:', error);
    }

    return delivery;
  }

  getRobots(): Robot[] {
    return Array.from(this.robots.values());
  }

  getRobot(id: string): Robot | undefined {
    return this.robots.get(id);
  }

  getSampleLocations(): Location[] {
    return SAMPLE_LOCATIONS;
  }

  getChargingStations(): Location[] {
    return CHARGING_STATIONS;
  }
}

export const robotSimulation = new RobotSimulation();
