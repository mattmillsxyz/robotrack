import { NextRequest, NextResponse } from 'next/server';
import { Location } from '../../types';
import polyline from 'polyline';

interface RouteRequest {
  waypoints: Location[];
}

interface RouteResponse {
  route: {
    coordinates: [number, number][]; // [lng, lat] pairs
    distance: number;
    duration: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RouteRequest = await request.json();
    const { waypoints } = body;

    if (!waypoints || waypoints.length < 2) {
      return NextResponse.json(
        { error: 'Invalid route request. Must have at least 2 waypoints.' },
        { status: 400 }
      );
    }

    // Build OSRM coordinates string
    const coordinates = waypoints
      .map(point => `${point.lng},${point.lat}`)
      .join(';');

    // Call OSRM API
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&steps=true`;
    
    console.log('Calculating route with OSRM:', osrmUrl);
    
    const response = await fetch(osrmUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('OSRM API error:', response.status, response.statusText);
      // Fallback to straight-line route if OSRM fails
      return NextResponse.json({
        route: {
          coordinates: waypoints.map(point => [point.lng, point.lat]),
          distance: calculateStraightLineDistance(waypoints),
          duration: calculateStraightLineDistance(waypoints) * 60, // Rough estimate
        }
      });
    }

    const osrmData = await response.json();
    
    console.log('OSRM response status:', response.status);
    
    // Save OSRM response to file for debugging
    const fs = require('fs');
    const path = require('path');
    const debugFile = path.join(process.cwd(), 'osrm-debug.json');
    fs.writeFileSync(debugFile, JSON.stringify(osrmData, null, 2));
    console.log('OSRM response saved to:', debugFile);
    
    if (osrmData.code !== 'Ok') {
      console.error('OSRM route calculation failed:', osrmData.message);
      // Fallback to straight-line route
      return NextResponse.json({
        route: {
          coordinates: waypoints.map(point => [point.lng, point.lat] as [number, number]),
          distance: calculateStraightLineDistance(waypoints),
          duration: calculateStraightLineDistance(waypoints) * 60,
        }
      });
    }

    // Extract route coordinates from OSRM response using proper polyline decoding
    const routeCoordinates: [number, number][] = [];
    
    if (osrmData.routes && osrmData.routes[0] && osrmData.routes[0].geometry) {
      const geometry = osrmData.routes[0].geometry;
      if (typeof geometry === 'string') {
        // Use the polyline library to decode the route geometry
        try {
          const decodedCoords = polyline.decode(geometry) as [number, number][];
          console.log('Successfully decoded polyline:', decodedCoords.length, 'points');
          if (decodedCoords.length > 0) {
            console.log('First decoded coordinate:', decodedCoords[0]);
            console.log('Last decoded coordinate:', decodedCoords[decodedCoords.length - 1]);
            console.log('Sample of first 5 coordinates:', decodedCoords.slice(0, 5));
          }
          
          // The polyline library returns [lat, lng] but we need [lng, lat]
          const correctedCoords = decodedCoords.map(coord => [coord[1], coord[0]] as [number, number]);
          console.log('Corrected coordinates (swapped lat/lng):', correctedCoords.length, 'points');
          if (correctedCoords.length > 0) {
            console.log('First corrected coordinate:', correctedCoords[0]);
            console.log('Last corrected coordinate:', correctedCoords[correctedCoords.length - 1]);
          }
          
          routeCoordinates.push(...correctedCoords);
        } catch (error) {
          console.error('Error decoding polyline:', error);
          // Fallback to waypoints
          if (osrmData.waypoints && osrmData.waypoints.length > 0) {
            routeCoordinates.push(...osrmData.waypoints.map((waypoint: any) => 
              waypoint.location as [number, number]
            ));
          } else {
            routeCoordinates.push(...waypoints.map(point => [point.lng, point.lat] as [number, number]));
          }
        }
      } else {
        console.log('No polyline geometry, using waypoints');
        if (osrmData.waypoints && osrmData.waypoints.length > 0) {
          routeCoordinates.push(...osrmData.waypoints.map((waypoint: any) => 
            waypoint.location as [number, number]
          ));
        } else {
          routeCoordinates.push(...waypoints.map(point => [point.lng, point.lat] as [number, number]));
        }
      }
    } else {
      console.log('No route geometry found, using waypoints');
      if (osrmData.waypoints && osrmData.waypoints.length > 0) {
        routeCoordinates.push(...osrmData.waypoints.map((waypoint: any) => 
          waypoint.location as [number, number]
        ));
      } else {
        routeCoordinates.push(...waypoints.map(point => [point.lng, point.lat] as [number, number]));
      }
    }

    const routeResponse: RouteResponse = {
      route: {
        coordinates: routeCoordinates,
        distance: osrmData.routes?.[0]?.distance || calculateStraightLineDistance(waypoints),
        duration: osrmData.routes?.[0]?.duration || calculateStraightLineDistance(waypoints) * 60,
      }
    };

    console.log('Route calculated successfully:', routeResponse.route.coordinates.length, 'points');
    return NextResponse.json(routeResponse);

  } catch (error) {
    console.error('Route calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate route' },
      { status: 500 }
    );
  }
}

// Helper function to calculate straight-line distance as fallback
function calculateStraightLineDistance(waypoints: Location[]): number {
  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i].lng - waypoints[i-1].lng;
    const dy = waypoints[i].lat - waypoints[i-1].lat;
    totalDistance += Math.sqrt(dx * dx + dy * dy) * 111000; // Convert to meters (roughly)
  }
  return totalDistance;
}

// Helper function to decode Google polyline format
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let shift = 0, result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}
