import { NextRequest, NextResponse } from 'next/server';
import { robotSimulation } from '../../lib/robotSimulation';
import { DeliveryRequest, RouteSegment } from '../../types';

export async function POST(request: NextRequest) {
  console.log('Delivery API called');
  
  try {
    const body: DeliveryRequest = await request.json();
    const { robotId, stops } = body;

    console.log('Delivery request:', { robotId, stopsCount: stops?.length });

    if (!robotId || !stops || stops.length === 0 || stops.length > 4) {
      console.log('Invalid delivery request');
      return NextResponse.json(
        { error: 'Invalid delivery request. Must have 1-4 stops.' },
        { status: 400 }
      );
    }

    // Get the robot to calculate route from current position
    const robot = robotSimulation.getRobot(robotId);
    if (!robot) {
      console.log('Robot not found:', robotId);
      return NextResponse.json(
        { error: 'Robot not found' },
        { status: 404 }
      );
    }

    console.log('Robot found:', robot.name);
    console.log('Robot location:', robot.location);

    // Calculate the full route journey: robot → stop1 → stop2 → stop3 → charger
    console.log('Calculating full route journey for all stops');
    
    try {
      const routeJourney: RouteSegment[] = [];
      
      // Calculate route from robot to first stop
      const firstStop = stops[0];
      const firstWaypoints = [robot.location, firstStop];
      console.log('Calculating route: robot → first stop');
      
      const firstRouteResponse = await fetch(`${request.nextUrl.origin}/api/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waypoints: firstWaypoints }),
      });
      
      if (!firstRouteResponse.ok) {
        throw new Error(`Failed to calculate first route: ${firstRouteResponse.status}`);
      }
      
      const firstRouteData = await firstRouteResponse.json();
      routeJourney.push({
        from: robot.location,
        to: firstStop,
        route: firstRouteData.route,
        type: 'delivery'
      });
      
      // Calculate routes between stops
      for (let i = 0; i < stops.length - 1; i++) {
        const fromStop = stops[i];
        const toStop = stops[i + 1];
        console.log(`Calculating route: stop ${i + 1} → stop ${i + 2}`);
        
        const waypoints = [fromStop, toStop];
        const routeResponse = await fetch(`${request.nextUrl.origin}/api/routes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waypoints }),
        });
        
        if (!routeResponse.ok) {
          throw new Error(`Failed to calculate route between stops: ${routeResponse.status}`);
        }
        
        const routeData = await routeResponse.json();
        routeJourney.push({
          from: fromStop,
          to: toStop,
          route: routeData.route,
          type: 'delivery'
        });
      }
      
      // Calculate route from last stop to nearest charging station
      const lastStop = stops[stops.length - 1];
      // const chargingStations = robotSimulation.getChargingStations(); // Unused variable
      const nearestChargingStation = robotSimulation.findNearestChargingStation(lastStop);
      
      if (nearestChargingStation) {
        console.log('Calculating route: last stop → charging station');
        const chargingWaypoints = [lastStop, nearestChargingStation];
        const chargingRouteResponse = await fetch(`${request.nextUrl.origin}/api/routes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ waypoints: chargingWaypoints }),
        });
        
        if (chargingRouteResponse.ok) {
          const chargingRouteData = await chargingRouteResponse.json();
          routeJourney.push({
            from: lastStop,
            to: nearestChargingStation,
            route: chargingRouteData.route,
            type: 'charging'
          });
        }
      }
      
      console.log('Full route journey calculated:', routeJourney.length, 'segments');
      
      // Create delivery with full route journey
      const delivery = await robotSimulation.createDeliveryWithRouteJourney(robotId, stops, routeJourney);
      if (!delivery) {
        console.log('Failed to create delivery with route journey');
        return NextResponse.json(
          { error: 'Robot not available for delivery' },
          { status: 400 }
        );
      }

      console.log('Delivery created successfully with full route journey');
      return NextResponse.json(delivery);
    } catch (routeError) {
      console.error('Route calculation failed, creating delivery without route:', routeError);
      
      // Fallback: create delivery without route
      const delivery = await robotSimulation.createDelivery(robotId, stops);
      if (!delivery) {
        console.log('Failed to create delivery without route');
        return NextResponse.json(
          { error: 'Robot not available for delivery' },
          { status: 400 }
        );
      }

      console.log('Delivery created successfully without route');
      return NextResponse.json(delivery);
    }
  } catch (error) {
    console.error('Delivery creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery' },
      { status: 500 }
    );
  }
}
