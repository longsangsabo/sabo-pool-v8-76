// Performance Monitoring Types
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: {
    entryType?: string;
    startTime?: number;
    domContentLoaded?: number;
    loadComplete?: number;
    redirectTime?: number;
    dnsTime?: number;
    connectTime?: number;
    responseTime?: number;
    transferSize?: number;
    encodedBodySize?: number;
    decodedBodySize?: number;
    type?:
      | 'navigation_timing'
      | 'large_resource'
      | 'slow_resource'
      | 'custom_timer';
    url?: string;
    duration?: number;
    [key: string]: any;
  };
}

export interface APICallMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  userId?: string;
}

export interface PerformanceData {
  performance: PerformanceMetric[];
  apiCalls: APICallMetric[];
}

export interface WebVitalsMetric {
  name: string;
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  entries: PerformanceEntry[];
}

export interface PerformanceTimings {
  'Page Load Time': number;
  'DOM Content Loaded': number;
  'First Byte': number;
  'DNS Lookup': number;
  'Connection Time': number;
  'Server Response': number;
  'DOM Processing': number;
}
