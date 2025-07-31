import React from 'react';
import { Signal, SignalHigh, SignalLow, SignalMedium, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConnectionQualityProps {
  showText?: boolean;
  showLatency?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConnectionQuality: React.FC<ConnectionQualityProps> = ({
  showText = true,
  showLatency = false,
  size = 'md'
}) => {
  const { networkQuality, isChecking } = useNetworkStatus();

  const getIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    
    if (!networkQuality.isOnline) {
      return <WifiOff className={iconSize} />;
    }

    switch (networkQuality.speed) {
      case 'fast':
        return <SignalHigh className={`${iconSize} text-green-600`} />;
      case 'moderate':
        return <SignalMedium className={`${iconSize} text-yellow-600`} />;
      case 'slow':
        return <SignalLow className={`${iconSize} text-red-600`} />;
      default:
        return <Signal className={iconSize} />;
    }
  };

  const getQualityText = () => {
    if (!networkQuality.isOnline) return 'Offline';
    
    switch (networkQuality.speed) {
      case 'fast': return 'Tốt';
      case 'moderate': return 'Bình thường';
      case 'slow': return 'Chậm';
      default: return 'Không xác định';
    }
  };

  const getQualityVariant = () => {
    if (!networkQuality.isOnline) return 'destructive';
    
    switch (networkQuality.speed) {
      case 'fast': return 'default';
      case 'moderate': return 'secondary';
      case 'slow': return 'destructive';
      default: return 'outline';
    }
  };

  const getTooltipContent = () => {
    return (
      <div className="space-y-1">
        <div>Trạng thái: {networkQuality.isOnline ? 'Online' : 'Offline'}</div>
        <div>Chất lượng: {getQualityText()}</div>
        <div>Độ trễ: {networkQuality.latency}ms</div>
        {networkQuality.effectiveType && (
          <div>Loại kết nối: {networkQuality.effectiveType}</div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={`${isChecking ? 'animate-pulse' : ''}`}>
              {getIcon()}
            </div>
            
            {showText && (
              <Badge variant={getQualityVariant()} className={
                size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'
              }>
                {getQualityText()}
              </Badge>
            )}

            {showLatency && networkQuality.latency > 0 && (
              <span className={`text-muted-foreground ${
                size === 'sm' ? 'text-xs' : 'text-sm'
              }`}>
                {networkQuality.latency}ms
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};