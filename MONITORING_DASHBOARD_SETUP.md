# 📊 PRODUCTION MONITORING DASHBOARD SETUP

## Real User Monitoring (RUM) Implementation

### Core Web Vitals Tracking Setup

```javascript
// src/lib/monitoring/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userId?: string;
}

const webVitalsConfig = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 }
};

function sendToAnalytics(metric: WebVitalMetric) {
  // Send to your analytics service
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.value),
      custom_map: { metric_rating: metric.rating }
    });
  }
  
  // Send to Supabase for internal tracking
  supabase.from('web_vitals_metrics').insert({
    metric_name: metric.name,
    value: metric.value,
    rating: metric.rating,
    url: metric.url,
    user_id: metric.userId,
    timestamp: new Date(metric.timestamp).toISOString()
  });
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = webVitalsConfig[name as keyof typeof webVitalsConfig];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

export function initWebVitalsTracking() {
  getCLS((metric) => {
    sendToAnalytics({
      name: 'CLS',
      value: metric.value,
      rating: getRating('CLS', metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      userId: getCurrentUserId()
    });
  });

  getFID((metric) => {
    sendToAnalytics({
      name: 'FID',
      value: metric.value,
      rating: getRating('FID', metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      userId: getCurrentUserId()
    });
  });

  getLCP((metric) => {
    sendToAnalytics({
      name: 'LCP',
      value: metric.value,
      rating: getRating('LCP', metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      userId: getCurrentUserId()
    });
  });

  getFCP((metric) => {
    sendToAnalytics({
      name: 'FCP',
      value: metric.value,
      rating: getRating('FCP', metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      userId: getCurrentUserId()
    });
  });

  getTTFB((metric) => {
    sendToAnalytics({
      name: 'TTFB',
      value: metric.value,
      rating: getRating('TTFB', metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      userId: getCurrentUserId()
    });
  });
}
```

### Custom Performance Metrics

```javascript
// src/lib/monitoring/customMetrics.ts
class PerformanceTracker {
  private startTimes: Map<string, number> = new Map();
  
  startTimer(name: string): void {
    this.startTimes.set(name, performance.now());
  }
  
  endTimer(name: string): number {
    const startTime = this.startTimes.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.startTimes.delete(name);
    
    // Send to analytics
    this.trackCustomMetric(name, duration);
    
    return duration;
  }
  
  private trackCustomMetric(name: string, value: number): void {
    // Track in Supabase
    supabase.from('performance_metrics').insert({
      metric_name: name,
      value: value,
      url: window.location.href,
      user_id: getCurrentUserId(),
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });
    
    // Also send to external monitoring
    if (window.gtag) {
      window.gtag('event', 'custom_performance', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value)
      });
    }
  }
  
  // Pre-defined business metrics
  trackTournamentCreation(): void {
    this.startTimer('tournament_creation');
  }
  
  completeTournamentCreation(): void {
    this.endTimer('tournament_creation');
  }
  
  trackChallengeFlow(): void {
    this.startTimer('challenge_flow');
  }
  
  completeChallengeFlow(): void {
    this.endTimer('challenge_flow');
  }
  
  trackProfileUpdate(): void {
    this.startTimer('profile_update');
  }
  
  completeProfileUpdate(): void {
    this.endTimer('profile_update');
  }
}

export const performanceTracker = new PerformanceTracker();
```

### Error Tracking System

```javascript
// src/lib/monitoring/errorTracking.ts
interface ErrorContext {
  userId?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  component?: string;
  action?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorTracker {
  private errorQueue: Array<any> = [];
  private isOnline = navigator.onLine;
  
  constructor() {
    // Global error handlers
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    // Network status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });
    window.addEventListener('offline', () => this.isOnline = false);
  }
  
  private handleError(event: ErrorEvent): void {
    this.trackError({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      type: 'javascript_error',
      severity: 'medium'
    });
  }
  
  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    this.trackError({
      message: `Unhandled Promise Rejection: ${event.reason}`,
      type: 'promise_rejection',
      severity: 'high',
      stack: event.reason?.stack
    });
  }
  
  trackError(error: any, context?: Partial<ErrorContext>): void {
    const errorData = {
      ...error,
      ...context,
      userId: getCurrentUserId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: getSessionId()
    };
    
    if (this.isOnline) {
      this.sendError(errorData);
    } else {
      this.errorQueue.push(errorData);
    }
  }
  
  private async sendError(errorData: any): Promise<void> {
    try {
      // Send to Supabase
      await supabase.from('error_logs').insert({
        error_type: errorData.type || 'unknown',
        error_message: errorData.message,
        stack_trace: errorData.stack,
        url: errorData.url,
        user_id: errorData.userId,
        user_agent: errorData.userAgent,
        timestamp: new Date(errorData.timestamp).toISOString()
      });
      
      // Also send to external service (Sentry, etc.)
      if (window.Sentry) {
        window.Sentry.captureException(errorData);
      }
    } catch (e) {
      console.error('Failed to send error to tracking service:', e);
    }
  }
  
  private flushErrorQueue(): void {
    while (this.errorQueue.length > 0) {
      const error = this.errorQueue.shift();
      this.sendError(error);
    }
  }
}

export const errorTracker = new ErrorTracker();
```

## Business Metrics Dashboard

### User Engagement Tracking

```javascript
// src/lib/monitoring/businessMetrics.ts
class BusinessMetricsTracker {
  private sessionStart = Date.now();
  
  // Tournament metrics
  trackTournamentView(tournamentId: string): void {
    this.trackEvent('tournament_viewed', {
      tournament_id: tournamentId,
      page_url: window.location.href
    });
  }
  
  trackTournamentRegistration(tournamentId: string, success: boolean): void {
    this.trackEvent('tournament_registration', {
      tournament_id: tournamentId,
      success: success,
      conversion_time: Date.now() - this.sessionStart
    });
  }
  
  // Challenge metrics
  trackChallengeCreated(challengeType: string, stakeAmount: number): void {
    this.trackEvent('challenge_created', {
      challenge_type: challengeType,
      stake_amount: stakeAmount
    });
  }
  
  trackChallengeAccepted(challengeId: string, responseTime: number): void {
    this.trackEvent('challenge_accepted', {
      challenge_id: challengeId,
      response_time: responseTime
    });
  }
  
  // User behavior metrics
  trackPageView(pageName: string): void {
    this.trackEvent('page_view', {
      page_name: pageName,
      referrer: document.referrer,
      session_duration: Date.now() - this.sessionStart
    });
  }
  
  trackFeatureUsage(featureName: string, action: string): void {
    this.trackEvent('feature_usage', {
      feature_name: featureName,
      action: action,
      timestamp: Date.now()
    });
  }
  
  // Conversion funnel tracking
  trackFunnelStep(funnelName: string, step: string, stepNumber: number): void {
    this.trackEvent('funnel_step', {
      funnel_name: funnelName,
      step: step,
      step_number: stepNumber,
      time_in_funnel: Date.now() - this.sessionStart
    });
  }
  
  private trackEvent(eventName: string, properties: any): void {
    const eventData = {
      event_name: eventName,
      properties: properties,
      user_id: getCurrentUserId(),
      session_id: getSessionId(),
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    // Send to analytics
    supabase.from('analytics_events').insert(eventData);
    
    // Also send to external analytics
    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }
  }
}

export const businessMetrics = new BusinessMetricsTracker();
```

### Conversion Rate Monitoring

```javascript
// src/lib/monitoring/conversionTracking.ts
class ConversionTracker {
  private funnels: Map<string, any> = new Map();
  
  startFunnel(funnelName: string, initialData?: any): void {
    this.funnels.set(funnelName, {
      startTime: Date.now(),
      currentStep: 1,
      data: initialData || {},
      steps: []
    });
  }
  
  trackFunnelStep(funnelName: string, stepName: string, data?: any): void {
    const funnel = this.funnels.get(funnelName);
    if (!funnel) return;
    
    funnel.steps.push({
      step: funnel.currentStep,
      name: stepName,
      timestamp: Date.now(),
      timeFromStart: Date.now() - funnel.startTime,
      data: data
    });
    
    funnel.currentStep++;
  }
  
  completeFunnel(funnelName: string, success: boolean, finalData?: any): void {
    const funnel = this.funnels.get(funnelName);
    if (!funnel) return;
    
    const conversionData = {
      funnel_name: funnelName,
      success: success,
      total_time: Date.now() - funnel.startTime,
      steps_completed: funnel.currentStep - 1,
      conversion_data: {
        ...funnel.data,
        ...finalData,
        steps: funnel.steps
      },
      user_id: getCurrentUserId(),
      timestamp: new Date().toISOString()
    };
    
    // Track conversion
    supabase.from('conversion_tracking').insert(conversionData);
    
    // Clean up
    this.funnels.delete(funnelName);
  }
  
  // Pre-defined funnels
  startTournamentRegistrationFunnel(tournamentId: string): void {
    this.startFunnel('tournament_registration', { tournament_id: tournamentId });
  }
  
  trackTournamentRegistrationStep(stepName: string): void {
    this.trackFunnelStep('tournament_registration', stepName);
  }
  
  completeTournamentRegistration(success: boolean): void {
    this.completeFunnel('tournament_registration', success);
  }
}

export const conversionTracker = new ConversionTracker();
```

## Alerting System Configuration

### Alert Rules Definition

```javascript
// config/alertRules.js
export const alertRules = {
  // Performance alerts
  highErrorRate: {
    metric: 'error_rate',
    threshold: 1.0, // 1%
    duration: '5m',
    severity: 'critical',
    channels: ['slack', 'email', 'sms']
  },
  
  slowResponseTime: {
    metric: 'response_time_p95',
    threshold: 5000, // 5 seconds
    duration: '5m',
    severity: 'high',
    channels: ['slack', 'email']
  },
  
  memoryLeak: {
    metric: 'memory_usage',
    threshold: 200, // 200MB
    duration: '10m',
    severity: 'high',
    channels: ['slack']
  },
  
  // Business alerts
  lowConversionRate: {
    metric: 'tournament_registration_rate',
    threshold: 0.05, // 5%
    duration: '1h',
    severity: 'medium',
    channels: ['slack']
  },
  
  highUserDropoff: {
    metric: 'session_abandonment_rate',
    threshold: 0.8, // 80%
    duration: '30m',
    severity: 'medium',
    channels: ['slack']
  },
  
  // Infrastructure alerts
  highCPUUsage: {
    metric: 'cpu_usage',
    threshold: 80, // 80%
    duration: '5m',
    severity: 'high',
    channels: ['slack', 'email']
  },
  
  databaseSlowQueries: {
    metric: 'db_query_time_p95',
    threshold: 10000, // 10 seconds
    duration: '2m',
    severity: 'critical',
    channels: ['slack', 'email']
  }
};
```

### Alert Management System

```javascript
// src/lib/monitoring/alertManager.ts
class AlertManager {
  private activeAlerts: Map<string, any> = new Map();
  private alertCooldowns: Map<string, number> = new Map();
  
  async checkAlerts(): Promise<void> {
    for (const [alertName, rule] of Object.entries(alertRules)) {
      try {
        const currentValue = await this.getMetricValue(rule.metric, rule.duration);
        
        if (this.shouldTriggerAlert(alertName, rule, currentValue)) {
          await this.triggerAlert(alertName, rule, currentValue);
        } else if (this.shouldResolveAlert(alertName, rule, currentValue)) {
          await this.resolveAlert(alertName);
        }
      } catch (error) {
        console.error(`Error checking alert ${alertName}:`, error);
      }
    }
  }
  
  private shouldTriggerAlert(alertName: string, rule: any, currentValue: number): boolean {
    const isThresholdBreached = currentValue > rule.threshold;
    const isNotInCooldown = !this.alertCooldowns.has(alertName) || 
                           Date.now() > this.alertCooldowns.get(alertName)!;
    const isNotAlreadyActive = !this.activeAlerts.has(alertName);
    
    return isThresholdBreached && isNotInCooldown && isNotAlreadyActive;
  }
  
  private shouldResolveAlert(alertName: string, rule: any, currentValue: number): boolean {
    const isThresholdNormal = currentValue <= rule.threshold;
    const isAlertActive = this.activeAlerts.has(alertName);
    
    return isThresholdNormal && isAlertActive;
  }
  
  private async triggerAlert(alertName: string, rule: any, currentValue: number): Promise<void> {
    const alert = {
      name: alertName,
      metric: rule.metric,
      threshold: rule.threshold,
      currentValue: currentValue,
      severity: rule.severity,
      timestamp: Date.now(),
      status: 'active'
    };
    
    this.activeAlerts.set(alertName, alert);
    
    // Send notifications
    for (const channel of rule.channels) {
      await this.sendNotification(channel, alert);
    }
    
    // Log alert
    await supabase.from('alert_logs').insert({
      alert_name: alertName,
      metric_name: rule.metric,
      threshold_value: rule.threshold,
      current_value: currentValue,
      severity: rule.severity,
      status: 'triggered',
      timestamp: new Date().toISOString()
    });
    
    // Set cooldown (prevent spam)
    this.alertCooldowns.set(alertName, Date.now() + (15 * 60 * 1000)); // 15 minutes
  }
  
  private async resolveAlert(alertName: string): Promise<void> {
    const alert = this.activeAlerts.get(alertName);
    if (!alert) return;
    
    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    
    // Send resolution notification
    await this.sendNotification('slack', {
      ...alert,
      message: `✅ Alert resolved: ${alertName}`
    });
    
    // Log resolution
    await supabase.from('alert_logs').insert({
      alert_name: alertName,
      status: 'resolved',
      timestamp: new Date().toISOString()
    });
    
    this.activeAlerts.delete(alertName);
  }
  
  private async sendNotification(channel: string, alert: any): Promise<void> {
    switch (channel) {
      case 'slack':
        await this.sendSlackNotification(alert);
        break;
      case 'email':
        await this.sendEmailNotification(alert);
        break;
      case 'sms':
        await this.sendSMSNotification(alert);
        break;
    }
  }
  
  private async sendSlackNotification(alert: any): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;
    
    const message = {
      text: `🚨 ${alert.severity.toUpperCase()} Alert: ${alert.name}`,
      attachments: [{
        color: alert.severity === 'critical' ? 'danger' : 'warning',
        fields: [
          { title: 'Metric', value: alert.metric, short: true },
          { title: 'Current Value', value: alert.currentValue.toString(), short: true },
          { title: 'Threshold', value: alert.threshold.toString(), short: true },
          { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true }
        ]
      }]
    };
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }
}

export const alertManager = new AlertManager();

// Start monitoring
setInterval(() => alertManager.checkAlerts(), 60000); // Check every minute
```

## Dashboard Configuration

### Real-time Metrics Dashboard

```typescript
// src/components/monitoring/MetricsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MetricData {
  timestamp: string;
  value: number;
  metric_name: string;
}

export function MetricsDashboard() {
  const [webVitals, setWebVitals] = useState<MetricData[]>([]);
  const [errorRates, setErrorRates] = useState<MetricData[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<MetricData[]>([]);
  
  useEffect(() => {
    fetchMetrics();
    
    // Set up real-time subscriptions
    const webVitalsSubscription = supabase
      .channel('web_vitals_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'web_vitals_metrics'
      }, (payload) => {
        setWebVitals(prev => [...prev, payload.new as MetricData]);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(webVitalsSubscription);
    };
  }, []);
  
  const fetchMetrics = async () => {
    const { data: vitals } = await supabase
      .from('web_vitals_metrics')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
      
    const { data: errors } = await supabase
      .from('error_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
      
    const { data: business } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
      
    setWebVitals(vitals || []);
    setErrorRates(errors || []);
    setBusinessMetrics(business || []);
  };
  
  return (
    <div className="monitoring-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Web Vitals */}
        <div className="metric-card">
          <h3>Core Web Vitals</h3>
          <div className="metrics-grid">
            <MetricDisplay 
              name="LCP" 
              value={getLatestMetric(webVitals, 'LCP')} 
              threshold={2.5}
              unit="s"
            />
            <MetricDisplay 
              name="FID" 
              value={getLatestMetric(webVitals, 'FID')} 
              threshold={100}
              unit="ms"
            />
            <MetricDisplay 
              name="CLS" 
              value={getLatestMetric(webVitals, 'CLS')} 
              threshold={0.1}
              unit=""
            />
          </div>
        </div>
        
        {/* Error Rates */}
        <div className="metric-card">
          <h3>Error Rates</h3>
          <div className="error-summary">
            <div className="error-rate">
              <span className="rate">{calculateErrorRate(errorRates)}%</span>
              <span className="label">24h Error Rate</span>
            </div>
            <div className="error-breakdown">
              {getErrorBreakdown(errorRates).map(error => (
                <div key={error.type} className="error-type">
                  <span>{error.type}: {error.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Business Metrics */}
        <div className="metric-card">
          <h3>Business Metrics</h3>
          <div className="business-summary">
            <MetricDisplay 
              name="Tournament Registrations" 
              value={countEvents(businessMetrics, 'tournament_registration')} 
              threshold={50}
              unit=""
            />
            <MetricDisplay 
              name="Challenge Creations" 
              value={countEvents(businessMetrics, 'challenge_created')} 
              threshold={30}
              unit=""
            />
            <MetricDisplay 
              name="Profile Updates" 
              value={countEvents(businessMetrics, 'profile_updated')} 
              threshold={100}
              unit=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

Created comprehensive production readiness documentation with detailed testing, deployment, and monitoring plans.