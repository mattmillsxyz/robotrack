import { NextRequest, NextResponse } from 'next/server';
import { Location } from '../../../types';
import polyline from 'polyline';

interface SegmentRouteRequest {
  from: Location;
  to: Location;
}

interface SegmentRouteResponse {
  route: {
    coordinates: [number, number][]; // [lng, lat] pairs
    distance: number;
    duration: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SegmentRouteRequest = await request.json();
    const { from, to } = body;

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Invalid segment route request. Must have from and to locations.' },
        { status: 400 }
      );
    }

    // Build OSRM coordinates string
    const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;

    // Call OSRM API
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&steps=true`;
    
    console.log('Calculating segment route with OSRM:', osrmUrl);
    
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
          coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
          distance: calculateStraightLineDistance([from, to]),
          duration: calculateStraightLineDistance([from, to]) * 60, // Rough estimate
        }
      });
    }

    const osrmData = await response.json();
    
    if (osrmData.code !== 'Ok') {
      console.error('OSRM route calculation failed:', osrmData.message);
      // Fallback to straight-line route
      return NextResponse.json({
        route: {
          coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
          distance: calculateStraightLineDistance([from, to]),
          duration: calculateStraightLineDistance([from, to]) * 60,
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
          
          // The polyline library returns [lat, lng] but we need [lng, lat]
          const correctedCoords = decodedCoords.map(coord => [coord[1], coord[0]] as [number, number]);
          routeCoordinates.push(...correctedCoords);
        } catch (error) {
          console.error('Error decoding polyline:', error);
          // Fallback to waypoints
          if (osrmData.waypoints && osrmData.waypoints.length > 0) {
            routeCoordinates.push(...osrmData.waypoints.map((waypoint: { location: [number, number] }) => 
              waypoint.location as [number, number]
            ));
          } else {
            routeCoordinates.push([from.lng, from.lat], [to.lng, to.lat]);
          }
        }
      } else {
        console.log('No polyline geometry, using waypoints');
        if (osrmData.waypoints && osrmData.waypoints.length > 0) {
          routeCoordinates.push(...osrmData.waypoints.map((waypoint: { location: [number, number] }) => 
            waypoint.location as [number, number]
          ));
        } else {
          routeCoordinates.push([from.lng, from.lat], [to.lng, to.lat]);
        }
      }
    } else {
      console.log('No route geometry found, using waypoints');
      if (osrmData.waypoints && osrmData.waypoints.length > 0) {
        routeCoordinates.push(...osrmData.waypoints.map((waypoint: { location: [number, number] }) => 
          waypoint.location as [number, number]
        ));
      } else {
        routeCoordinates.push([from.lng, from.lat], [to.lng, to.lat]);
      }
    }
    
    console.log('Final segment route coordinates:', routeCoordinates.length, 'points');
    
    const routeResponse: SegmentRouteResponse = {
      route: {
        coordinates: routeCoordinates,
        distance: osrmData.routes?.[0]?.distance || calculateStraightLineDistance([from, to]),
        duration: osrmData.routes?.[0]?.duration || calculateStraightLineDistance([from, to]) * 60,
      }
    };

    console.log('Segment route calculated successfully:', routeResponse.route.coordinates.length, 'points');
    return NextResponse.json(routeResponse);

  } catch (error) {
    console.error('Segment route calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate segment route' },
      { status: 500 }
    );
  }
}

// Helper function to calculate straight-line distance as fallback
function calculateStraightLineDistance(locations: Location[]): number {
  let totalDistance = 0;
  for (let i = 1; i < locations.length; i++) {
    const dx = locations[i].lng - locations[i-1].lng;
    const dy = locations[i].lat - locations[i-1].lat;
    totalDistance += Math.sqrt(dx * dx + dy * dy) * 111000; // Convert to meters (roughly)
  }
  return totalDistance;
}
