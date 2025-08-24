import { Bot, Route, Zap, Wrench, WifiOff, Package } from 'lucide-react';
import { Robot } from '../types';

export const getStatusIcon = (status: Robot['status'], size: 'sm' | 'lg' = 'sm') => {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  
  switch (status) {
    case 'idle':
      return <Bot className={sizeClass + ' text-primary'} />;
    case 'delivering':
      return <Route className={sizeClass + ' text-success animate-pulse'} />;
    case 'charging':
      return <Zap className={sizeClass + ' text-warning animate-pulse'} />;
    case 'maintenance':
      return <Wrench className={sizeClass + ' text-warning'} />;
    case 'offline':
      return <WifiOff className={sizeClass + ' text-danger'} />;
    default:
      return <Package className={sizeClass + ' text-default-400'} />;
  }
};
