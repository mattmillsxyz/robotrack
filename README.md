# RoboTrack - Autonomous Robot Delivery Simulation

A real-time robotics fleet management and delivery simulation platform built with Next.js, React, and WebSocket technology. Monitor autonomous robots as they navigate through a simulated city environment, manage deliveries, and track battery levels in real-time.

![RoboTrack Dashboard](https://img.shields.io/badge/Status-Live%20Simulation-green) ![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black) ![React](https://img.shields.io/badge/React-19.1.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🚀 Features

### Real-Time Robot Monitoring
- **Live Location Tracking**: Watch robots move in real-time across an interactive map
- **Status Management**: Monitor robot states (idle, delivering, charging, maintenance, offline)
- **Battery Management**: Real-time battery level tracking with automatic charging
- **Speed Monitoring**: Track robot movement speeds during deliveries

### Interactive Map Interface
- **Leaflet Integration**: High-performance mapping with real-time updates
- **Robot Visualization**: Color-coded robots with status indicators
- **Route Display**: Visual representation of delivery routes and charging station paths
- **Interactive Selection**: Click robots to view detailed information

### Delivery Management
- **Multi-Stop Deliveries**: Create complex delivery routes with up to 4 stops
- **Route Optimization**: Intelligent routing with intermediate waypoints
- **Delivery Status Tracking**: Monitor delivery progress from pending to completion
- **Automatic Assignment**: Smart robot selection based on availability and battery

### Fleet Management
- **Robot Fleet**: Manage up to 8 autonomous robots
- **Individual Robot Details**: View comprehensive robot information and history
- **Performance Metrics**: Track delivery completion rates and efficiency
- **Maintenance Alerts**: Automatic notifications for low battery and maintenance needs

### Real-Time Communication
- **WebSocket Integration**: Live updates without page refresh
- **Polling System**: 200ms update frequency for smooth real-time experience
- **Connection Status**: Visual indicators for system connectivity

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.4.5, React 19.1.0, TypeScript
- **UI Framework**: HeroUI React, Tailwind CSS
- **Mapping**: Leaflet, React-Leaflet, Leaflet Routing Machine
- **Animations**: Framer Motion
- **Real-time**: Socket.IO
- **Icons**: Lucide React
- **Routing**: Polyline for route calculations

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **Yarn** (recommended) or npm
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd robotrack
```

### 2. Set up Vercel Redis (for Production)

To enable data persistence and multi-user support, you'll need to set up Vercel's Redis integration:

1. **Link your project** (if not already done):
   ```bash
   vercel link
   ```

2. **Pull environment variables**:
   ```bash
   vercel env pull .env.development.local
   ```

3. **Create Redis Database** (in Vercel Dashboard):
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your `robotrack` project
   - Go to the **"Storage"** tab
   - Click **"Create Database"**
   - Select **"Redis"** (Vercel's managed Redis)
   - Choose your plan and **"Continue"**
   - Enter a database name (e.g., "robotrack-redis")
   - Select **"Create"**

4. **Pull updated environment variables**:
   ```bash
   vercel env pull .env.development.local
   ```

5. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

**Note**: For local development, the app will work without Redis but data won't persist between restarts.

### 3. Install Dependencies

```bash
yarn install
# or
npm install
```

### 4. Start the Development Server

```bash
yarn dev
# or
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 5. Access the Dashboard

Open your browser and navigate to the application URL. You'll see the RoboTrack dashboard with:

- A sidebar showing all robots and their current status
- An interactive map displaying robot locations
- Real-time updates every 200ms
- Connection status indicators

## 🎮 How to Use

### Creating a Delivery

1. **Click "New Delivery"** in the top-right corner
2. **Select a Robot**: Choose from available idle robots
3. **Add Stops**: Select up to 4 delivery locations
4. **Submit**: The robot will automatically begin the delivery

### Monitoring Robots

1. **View Robot List**: See all robots in the left sidebar
2. **Click on Robots**: Select any robot to view detailed information
3. **Watch Real-time Movement**: Observe robots moving on the map
4. **Monitor Battery**: Track battery levels and charging behavior

### Understanding Robot States

- **🟢 Idle**: Robot is available for new deliveries
- **🟡 Delivering**: Robot is actively making deliveries
- **🔵 Charging**: Robot is at a charging station
- **🔴 Maintenance**: Robot requires maintenance
- **⚫ Offline**: Robot is not responding

## 🏗️ Project Structure

```
robotrack/
├── app/
│   ├── api/                    # API routes
│   │   ├── robots/            # Robot management endpoints
│   │   ├── deliveries/        # Delivery creation and tracking
│   │   ├── locations/         # Location data endpoints
│   │   └── socket/            # WebSocket connections
│   ├── components/            # React components
│   │   ├── RobotCard.tsx      # Individual robot display
│   │   ├── RobotMap.tsx       # Interactive map component
│   │   ├── RobotDetails.tsx   # Detailed robot information
│   │   └── DeliveryForm.tsx   # Delivery creation form
│   ├── lib/                   # Utility libraries
│   │   ├── robotSimulation.ts # Core simulation logic
│   │   └── locations.ts       # Location data management
│   ├── types/                 # TypeScript type definitions
│   └── page.tsx               # Main dashboard page
├── public/                    # Static assets
└── package.json              # Dependencies and scripts
```

## 🔧 Development Guide

### Data Persistence & Multi-User Support

RoboTrack now supports data persistence and multi-user scenarios:

#### **Local Development**
- Data is stored in memory only
- All users see the same robot simulation state
- Data resets when the server restarts

#### **Production (Vercel)**
- **Vercel Redis** stores all data persistently
- **Shared State**: All users see the same robots and delivery history
- **Persistence**: Data survives server restarts and deployments
- **Delivery History**: Last 100 deliveries are preserved
- **Robot State**: Current robot positions, battery, and status are maintained

#### **Multi-User Behavior**
- ✅ **Shared Robots**: All users see the same robot fleet
- ✅ **Shared Deliveries**: All users see the same delivery history
- ✅ **Real-time Updates**: Changes are reflected for all users via SSE
- ✅ **No Conflicts**: Single source of truth for all data

### Available Scripts

- `yarn dev` - Start development server with Turbopack
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

### Key Components

#### Robot Simulation (`app/lib/robotSimulation.ts`)
The core simulation engine that manages:
- Robot movement and routing
- Battery management and charging
- Delivery assignment and completion
- Real-time state updates

#### Interactive Map (`app/components/RobotMap.tsx`)
Built with Leaflet and React-Leaflet:
- Real-time robot position updates
- Route visualization
- Interactive markers and popups
- Responsive design

#### Delivery Management (`app/components/DeliveryForm.tsx`)
Form component for creating new deliveries:
- Robot selection based on availability
- Multi-stop route planning
- Location selection from predefined points
- Real-time validation

## 🌍 Simulation Environment

The simulation includes:

- **8 Autonomous Robots**: Each with unique colors and capabilities
- **Predefined Locations**: Realistic delivery destinations
- **Charging Stations**: Strategic locations for battery management
- **Route Optimization**: Intelligent pathfinding with waypoints
- **Battery Simulation**: Realistic power consumption and charging

### Robot Specifications

- **Speed**: 12 km/h during deliveries, 5 km/h when charging
- **Battery**: 100% capacity with realistic drain rates
- **Range**: Unlimited with automatic charging
- **Navigation**: GPS-based with route optimization

## 🔌 API Endpoints

### Robots
- `GET /api/robots` - Get all robots and their current status
- `GET /api/robots/[id]` - Get specific robot details

### Deliveries
- `POST /api/deliveries` - Create a new delivery
- `GET /api/deliveries` - Get all active deliveries

### Locations
- `GET /api/locations` - Get available delivery locations
- `GET /api/charging-stations` - Get charging station locations

### Routes
- `POST /api/routes` - Calculate optimal routes
- `POST /api/routes/segment` - Get route segments

## 🎨 Customization

### Adding New Robots
Edit `app/lib/robotSimulation.ts`:
```typescript
const ROBOT_NAMES = [
  'BOT-001',
  'BOT-002',
  // Add new robot names here
];
```

### Modifying Locations
Edit `app/lib/locations.ts` to add new delivery destinations or charging stations.

### Changing Simulation Speed
Modify the update interval in `robotSimulation.ts`:
```typescript
this.simulationInterval = setInterval(() => {
  this.updateRobots();
}, 200); // Change this value to adjust update frequency
```

## 🐛 Troubleshooting

### Common Issues

1. **Map Not Loading**
   - Ensure you have an internet connection (Leaflet requires map tiles)
   - Check browser console for errors

2. **Robots Not Moving**
   - Verify the simulation is running in the backend
   - Check WebSocket connection status

3. **Delivery Creation Fails**
   - Ensure selected robot is idle and has sufficient battery
   - Verify at least one stop is selected

### Performance Optimization

- The application uses Turbopack for faster development builds
- Real-time updates are optimized with 200ms polling intervals
- Map rendering is optimized with dynamic imports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Leaflet** for the mapping functionality
- **HeroUI** for the beautiful UI components
- **Framer Motion** for smooth animations
- **Socket.IO** for real-time communication

---

**RoboTrack** - Where autonomous delivery meets real-time monitoring. 🚀🤖
