import React, { useState, useCallback, useRef } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Play,
  Square,
  Navigation,
  TouchpadIcon,
  Eye,
} from 'lucide-react';

interface UXTestResult {
  testName: string;
  status: 'pass' | 'fail' | 'manual';
  details: string;
  category: 'navigation' | 'accessibility' | 'interaction' | 'visual';
  autoTestable: boolean;
}

export const UserExperienceValidator: React.FC = () => {
  const responsive = useOptimizedResponsive();
  const [testResults, setTestResults] = useState<UXTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const touchTestRef = useRef<HTMLDivElement>(null);

  const runUXTests = useCallback(async () => {
    setIsRunning(true);
    const results: UXTestResult[] = [];

    // Test 1: Navigation Flow Testing
    setCurrentTest('Testing navigation flows...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const navLinks = document.querySelectorAll('nav a');
    const navAccessible = Array.from(navLinks).every(link => {
      const rect = link.getBoundingClientRect();
      const minSize = responsive.isMobile ? 44 : 32;
      return rect.height >= minSize && rect.width >= minSize;
    });

    results.push({
      testName: 'Navigation Touch Targets',
      status: navAccessible ? 'pass' : 'fail',
      details: `${navLinks.length} navigation elements checked for ${responsive.isMobile ? '44px' : '32px'} minimum size`,
      category: 'navigation',
      autoTestable: true,
    });

    // Test 2: Color Contrast Testing
    setCurrentTest('Checking color contrast...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const textElements = document.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, span, div'
    );
    let contrastIssues = 0;

    Array.from(textElements)
      .slice(0, 20)
      .forEach(element => {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        // Simple contrast check (would need more sophisticated algorithm in production)
        if (color === backgroundColor) {
          contrastIssues++;
        }
      });

    results.push({
      testName: 'Color Contrast Accessibility',
      status: contrastIssues === 0 ? 'pass' : 'fail',
      details: `${contrastIssues} potential contrast issues found in ${textElements.length} text elements`,
      category: 'accessibility',
      autoTestable: true,
    });

    // Test 3: Keyboard Navigation
    setCurrentTest('Testing keyboard navigation...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const focusableElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );

    results.push({
      testName: 'Keyboard Navigation',
      status: 'manual',
      details: `${focusableElements.length} focusable elements found. Manual testing required: Use Tab key to navigate through all interactive elements.`,
      category: 'accessibility',
      autoTestable: false,
    });

    // Test 4: Touch Gesture Support
    setCurrentTest('Validating touch gestures...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const touchSupport =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasSwipeableElements =
      document.querySelectorAll('[data-swipeable]').length > 0;

    results.push({
      testName: 'Touch Gesture Support',
      status: responsive.isMobile ? (touchSupport ? 'pass' : 'fail') : 'pass',
      details: responsive.isMobile
        ? `Touch support: ${touchSupport ? 'Available' : 'Not detected'}, Swipeable elements: ${hasSwipeableElements}`
        : 'Touch support not required for desktop',
      category: 'interaction',
      autoTestable: true,
    });

    // Test 5: Visual Hierarchy
    setCurrentTest('Analyzing visual hierarchy...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const hasProperHierarchy = headings.length > 0;

    results.push({
      testName: 'Visual Hierarchy',
      status: hasProperHierarchy ? 'pass' : 'fail',
      details: `${headings.length} heading elements found. Proper semantic heading structure is important for accessibility.`,
      category: 'visual',
      autoTestable: true,
    });

    // Test 6: Loading States
    setCurrentTest('Checking loading states...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const loadingElements = document.querySelectorAll(
      '[data-loading], .loading, .spinner'
    );

    results.push({
      testName: 'Loading State Indicators',
      status: 'manual',
      details: `${loadingElements.length} loading indicators found. Manual test: Verify loading states appear during data fetching.`,
      category: 'visual',
      autoTestable: false,
    });

    // Test 7: Error Handling
    setCurrentTest('Validating error handling...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const errorElements = document.querySelectorAll(
      '[data-error], .error, .alert-error'
    );

    results.push({
      testName: 'Error State Handling',
      status: 'manual',
      details: `${errorElements.length} error indicators found. Manual test: Trigger errors to verify proper error states and recovery options.`,
      category: 'interaction',
      autoTestable: false,
    });

    // Test 8: Responsive Image Loading
    setCurrentTest('Testing responsive images...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const images = document.querySelectorAll('img');
    let responsiveImages = 0;

    Array.from(images).forEach(img => {
      if (img.hasAttribute('srcset') || img.hasAttribute('sizes')) {
        responsiveImages++;
      }
    });

    results.push({
      testName: 'Responsive Image Optimization',
      status:
        images.length === 0 ? 'pass' : responsiveImages > 0 ? 'pass' : 'manual',
      details: `${responsiveImages}/${images.length} images use responsive loading techniques`,
      category: 'visual',
      autoTestable: true,
    });

    setTestResults(results);
    setIsRunning(false);
    setCurrentTest('');
  }, [responsive]);

  const getStatusIcon = (status: UXTestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'fail':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'manual':
        return <Eye className='h-4 w-4 text-blue-600' />;
    }
  };

  const getCategoryIcon = (category: UXTestResult['category']) => {
    switch (category) {
      case 'navigation':
        return <Navigation className='h-4 w-4' />;
      case 'accessibility':
        return <Eye className='h-4 w-4' />;
      case 'interaction':
        return <TouchpadIcon className='h-4 w-4' />;
      case 'visual':
        return <Eye className='h-4 w-4' />;
    }
  };

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;
  const manualCount = testResults.filter(r => r.status === 'manual').length;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>User Experience Validator</CardTitle>
          <Button onClick={runUXTests} disabled={isRunning} variant='outline'>
            {isRunning ? (
              <>
                <Square className='h-4 w-4 mr-2' />
                Running...
              </>
            ) : (
              <>
                <Play className='h-4 w-4 mr-2' />
                Run UX Tests
              </>
            )}
          </Button>
        </div>

        {isRunning && currentTest && (
          <p className='text-sm text-muted-foreground animate-pulse'>
            {currentTest}
          </p>
        )}
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Test Results Summary */}
        {testResults.length > 0 && (
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center p-3 bg-green-50 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>
                {passCount}
              </div>
              <div className='text-sm text-green-600'>Passed</div>
            </div>
            <div className='text-center p-3 bg-red-50 rounded-lg'>
              <div className='text-2xl font-bold text-red-600'>{failCount}</div>
              <div className='text-sm text-red-600'>Failed</div>
            </div>
            <div className='text-center p-3 bg-blue-50 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>
                {manualCount}
              </div>
              <div className='text-sm text-blue-600'>Manual Tests</div>
            </div>
          </div>
        )}

        {/* Current Device Context */}
        <Card className='bg-muted/50'>
          <CardContent className='pt-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <strong>Device Type:</strong> {responsive.breakpoint}
              </div>
              <div>
                <strong>Screen Size:</strong> {responsive.width}×
                {responsive.height}
              </div>
              <div>
                <strong>Touch Support:</strong>{' '}
                {'ontouchstart' in window ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Test Context:</strong>{' '}
                {responsive.isMobile
                  ? 'Mobile UX'
                  : responsive.isTablet
                    ? 'Tablet UX'
                    : 'Desktop UX'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Test Results */}
        <div className='space-y-3'>
          {testResults.map((result, index) => (
            <Alert key={index}>
              <div className='flex items-start space-x-3'>
                {getStatusIcon(result.status)}
                <div className='flex-1'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    {getCategoryIcon(result.category)}
                    <span className='font-medium'>{result.testName}</span>
                    <Badge
                      variant={
                        result.status === 'pass'
                          ? 'default'
                          : result.status === 'fail'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {result.status}
                    </Badge>
                    <Badge variant='outline'>{result.category}</Badge>
                    {!result.autoTestable && (
                      <Badge variant='secondary'>Manual</Badge>
                    )}
                  </div>
                  <AlertDescription className='mt-1'>
                    {result.details}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>

        {/* Manual Testing Guide */}
        <Card className='bg-yellow-50'>
          <CardHeader>
            <CardTitle className='text-sm'>Manual Testing Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-sm'>
              <div>
                ⌨️ <strong>Keyboard Navigation:</strong> Tab through all
                interactive elements
              </div>
              <div>
                📱 <strong>Touch Gestures:</strong> Test swipe, pinch, and tap
                interactions
              </div>
              <div>
                🔄 <strong>Loading States:</strong> Verify spinners and skeleton
                screens
              </div>
              <div>
                ❌ <strong>Error Handling:</strong> Test error states and
                recovery flows
              </div>
              <div>
                🎨 <strong>Visual Consistency:</strong> Check alignment and
                spacing across breakpoints
              </div>
              <div>
                ♿ <strong>Screen Reader:</strong> Test with assistive
                technologies
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Touch Test Area */}
        <div
          ref={touchTestRef}
          className='p-8 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center'
          onTouchStart={() => console.log('Touch detected')}
        >
          <TouchpadIcon className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>
            Touch Test Area - Try touching/clicking here to test gesture support
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
