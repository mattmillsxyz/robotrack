import { createClient } from 'redis';
import { Robot, Delivery } from '../types';

// Key prefixes for different data types
const ROBOTS_KEY = 'robotrack:robots';
const DELIVERIES_KEY = 'robotrack:deliveries';
const SIMULATION_STATE_KEY = 'robotrack:simulation';

export interface SimulationState {
  isRunning: boolean;
  lastUpdate: number;
}

// Create Redis client for DigitalOcean deployment
const createRedisClient = async () => {
  try {
    // Check if we have environment variables for Redis
    const redisUrl = process.env.REDIS_URL;
    const redisPassword = process.env.REDIS_PASSWORD;
    
    if (!redisUrl) {
      console.warn('No Redis configuration found. Using in-memory fallback.');
      return null;
    }

    const client = createClient({ 
      url: redisUrl,
      password: redisPassword,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    await client.connect();
    console.log('Connected to Redis successfully');
    return client;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    console.log('Falling back to in-memory storage for this session');
    return null;
  }
};

export class PersistenceManager {
  private static client: Awaited<ReturnType<typeof createRedisClient>> | null = null;

  private static async getClient() {
    if (!this.client) {
      this.client = await createRedisClient();
    }
    return this.client;
  }

  // Save all robots to Redis
  static async saveRobots(robots: Robot[]): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) {
        console.warn('No Redis client available, skipping save');
        return;
      }

      await client.set(ROBOTS_KEY, JSON.stringify(robots));
      // Robots are saved every 200ms, so we don't log this to avoid spam
    } catch (error) {
      console.error('Failed to save robots:', error);
    }
  }

  // Load all robots from Redis
  static async loadRobots(): Promise<Robot[]> {
    try {
      const client = await this.getClient();
      if (!client) {
        console.warn('No Redis client available, returning empty array');
        return [];
      }

      const data = await client.get(ROBOTS_KEY);
      if (data) {
        const robots = JSON.parse(data) as Robot[];
        // Only log on startup when robots are actually loaded
        if (robots.length > 0) {
          console.log(`Loaded ${robots.length} robots from Redis`);
        }
        return robots;
      }
    } catch (error) {
      console.error('Failed to load robots:', error);
    }
    return [];
  }

  // Save delivery history to Redis
  static async saveDeliveries(deliveries: Delivery[]): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) {
        console.warn('No Redis client available, skipping save');
        return;
      }

      await client.set(DELIVERIES_KEY, JSON.stringify(deliveries));
    } catch (error) {
      console.error('Failed to save deliveries:', error);
    }
  }

  // Load delivery history from Redis
  static async loadDeliveries(): Promise<Delivery[]> {
    try {
      const client = await this.getClient();
      if (!client) {
        console.warn('No Redis client available, returning empty array');
        return [];
      }

      const data = await client.get(DELIVERIES_KEY);
      if (data) {
        const deliveries = JSON.parse(data) as Delivery[];
        console.log(`Loaded ${deliveries.length} deliveries from Redis`);
        return deliveries;
      }
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    }
    return [];
  }

  // Save simulation state
  static async saveSimulationState(state: SimulationState): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) {
        console.warn('No Redis client available, skipping save');
        return;
      }

      await client.set(SIMULATION_STATE_KEY, JSON.stringify(state));
      console.log('Saved simulation state to Redis');
    } catch (error) {
      console.error('Failed to save simulation state:', error);
    }
  }

  // Load simulation state
  static async loadSimulationState(): Promise<SimulationState | null> {
    try {
      const client = await this.getClient();
      if (!client) {
        console.warn('No Redis client available, returning null');
        return null;
      }

      const data = await client.get(SIMULATION_STATE_KEY);
      if (data) {
        const state = JSON.parse(data) as SimulationState;
        console.log('Loaded simulation state from Redis');
        return state;
      }
    } catch (error) {
      console.error('Failed to load simulation state:', error);
    }
    return null;
  }

  // Add a new delivery to history
  static async addDelivery(delivery: Delivery): Promise<void> {
    try {
      const existingDeliveries = await this.loadDeliveries();
      const updatedDeliveries = [...existingDeliveries, delivery];
      
      // Keep only the last 100 deliveries to prevent unlimited growth
      const trimmedDeliveries = updatedDeliveries.slice(-100);
      
      await this.saveDeliveries(trimmedDeliveries);
      console.log(`Added delivery ${delivery.id} to history`);
    } catch (error) {
      console.error('Failed to add delivery:', error);
    }
  }

  // Update delivery status
  static async updateDelivery(deliveryId: string, status: Delivery['status']): Promise<void> {
    try {
      const deliveries = await this.loadDeliveries();
      const updatedDeliveries = deliveries.map(delivery => 
        delivery.id === deliveryId 
          ? { ...delivery, status }
          : delivery
      );
      await this.saveDeliveries(updatedDeliveries);
      console.log(`Updated delivery ${deliveryId} status to ${status}`);
    } catch (error) {
      console.error('Failed to update delivery:', error);
    }
  }

  // Clear all data (for reset functionality)
  static async clearAllData(): Promise<void> {
    try {
      const client = await this.getClient();
      if (!client) {
        console.warn('No Redis client available, skipping clear');
        return;
      }

      await client.del(ROBOTS_KEY);
      await client.del(DELIVERIES_KEY);
      await client.del(SIMULATION_STATE_KEY);
      console.log('Cleared all data from Redis');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  // Close Redis connection
  static async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.client = null;
        console.log('Disconnected from Redis');
      }
    } catch (error) {
      console.error('Failed to disconnect from Redis:', error);
    }
  }
}
