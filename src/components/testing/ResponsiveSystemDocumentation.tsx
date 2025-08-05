import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Copy,
  BookOpen,
  Code,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ResponsiveSystemDocumentation: React.FC = () => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string>('');

  const copyToClipboard = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(label);
    toast({
      title: 'Code copied!',
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const CodeBlock: React.FC<{
    code: string;
    language?: string;
    title: string;
  }> = ({ code, language = 'tsx', title }) => (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <h4 className='text-sm font-medium'>{title}</h4>
        <Button
          variant='outline'
          size='sm'
          onClick={() => copyToClipboard(code, title)}
          className='h-8'
        >
          <Copy className='h-3 w-3 mr-1' />
          {copiedCode === title ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <BookOpen className='h-5 w-5' />
          <CardTitle>Responsive System Documentation</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue='getting-started' className='space-y-4'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='getting-started'>Getting Started</TabsTrigger>
            <TabsTrigger value='components'>Components</TabsTrigger>
            <TabsTrigger value='best-practices'>Best Practices</TabsTrigger>
            <TabsTrigger value='troubleshooting'>Troubleshooting</TabsTrigger>
            <TabsTrigger value='migration'>Migration</TabsTrigger>
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value='getting-started' className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-4'>
                🚀 Quick Start Guide
              </h3>

              <Alert className='mb-4'>
                <CheckCircle className='h-4 w-4' />
                <AlertDescription>
                  <strong>3-Mode Responsive System:</strong> Mobile (&lt;768px),
                  Tablet (768-1024px), Desktop (≥1024px)
                </AlertDescription>
              </Alert>

              <div className='space-y-4'>
                <CodeBlock
                  title='Basic Hook Usage'
                  code={`import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';

const MyComponent = () => {
  const { isMobile, isTablet, isDesktop, breakpoint, width, height } = useOptimizedResponsive();
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </div>
  );
};`}
                />

                <CodeBlock
                  title='Layout Component Usage'
                  code={`import { ResponsiveLayout } from '@/components/layouts/ResponsiveLayout';

const App = () => {
  return (
    <ResponsiveLayout>
      <YourContent />
    </ResponsiveLayout>
  );
};

// Automatically renders:
// - SocialMobileLayout for mobile
// - TabletLayout for tablet  
// - DesktopLayout for desktop`}
                />

                <CodeBlock
                  title='Role-Based Layout Usage'
                  code={`import { RoleBasedLayout } from '@/components/layouts/RoleBasedLayout';

const App = () => {
  return (
    <RoleBasedLayout>
      <YourContent />
    </RoleBasedLayout>
  );
};

// Automatically selects:
// - AdminResponsiveLayout for admins
// - ClubResponsiveLayout for club owners
// - ResponsiveLayout for regular users`}
                />
              </div>
            </div>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value='components' className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-4'>
                📱 Mobile Components
              </h3>

              <div className='space-y-4'>
                <CodeBlock
                  title='Mobile Optimized Button'
                  code={`import { MobileTouchButton } from '@/components/mobile/MobileOptimizedComponents';

<MobileTouchButton 
  variant="primary" 
  size="lg"
  onClick={handleClick}
>
  Touch-Optimized Button (48px+ touch target)
</MobileTouchButton>`}
                />

                <CodeBlock
                  title='Mobile Card Component'
                  code={`import { MobileCard } from '@/components/mobile/MobileOptimizedComponents';

<MobileCard interactive padding="lg">
  <h3>Mobile-Optimized Card</h3>
  <p>Enhanced spacing and touch interactions</p>
</MobileCard>`}
                />

                <CodeBlock
                  title='Mobile Bottom Sheet'
                  code={`import { MobileSheet } from '@/components/mobile/MobileOptimizedComponents';

const [isOpen, setIsOpen] = useState(false);

<MobileSheet 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  title="Mobile Sheet"
>
  <YourContent />
</MobileSheet>`}
                />
              </div>
            </div>

            <div>
              <h3 className='text-lg font-semibold mb-4'>
                📋 Tablet Components
              </h3>

              <div className='space-y-4'>
                <CodeBlock
                  title='Tablet Optimized Container'
                  code={`import { TabletOptimizedContainer } from '@/components/tablet/TabletOptimizedComponents';

<TabletOptimizedContainer title="My Page">
  <YourContent />
</TabletOptimizedContainer>

// Provides:
// - 8-column main content area
// - 4-column sidebar
// - Enhanced spacing and touch targets`}
                />

                <CodeBlock
                  title='Tablet Grid System'
                  code={`import { TabletGrid, TabletCard } from '@/components/tablet/TabletOptimizedComponents';

<TabletGrid columns={3} gap="lg">
  <TabletCard>Card 1</TabletCard>
  <TabletCard>Card 2</TabletCard>
  <TabletCard>Card 3</TabletCard>
</TabletGrid>`}
                />
              </div>
            </div>
          </TabsContent>

          {/* Best Practices Tab */}
          <TabsContent value='best-practices' className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-4'>
                ✅ Development Best Practices
              </h3>

              <div className='grid gap-4'>
                <Alert>
                  <Lightbulb className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Performance:</strong> Always use
                    useOptimizedResponsive instead of useResponsive for better
                    performance with 150ms debouncing.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Lightbulb className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Memoization:</strong> Wrap layout components with
                    React.memo() to prevent unnecessary re-renders during
                    breakpoint changes.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <Lightbulb className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Early Returns:</strong> Use early return patterns in
                    responsive components to minimize conditional rendering.
                  </AlertDescription>
                </Alert>
              </div>

              <div className='space-y-4'>
                <CodeBlock
                  title='Memoized Responsive Component'
                  code={`import React, { memo } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';

const MyResponsiveComponent = memo(({ children }) => {
  const { isMobile, isTablet, isDesktop } = useOptimizedResponsive();
  
  // Early return pattern - only render one layout
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }
  
  if (isTablet) {
    return <TabletLayout>{children}</TabletLayout>;
  }
  
  return <DesktopLayout>{children}</DesktopLayout>;
});`}
                />

                <CodeBlock
                  title='Touch Target Standards'
                  code={`// Minimum touch target sizes
const TOUCH_TARGETS = {
  mobile: {
    minimum: '44px',    // Accessibility standard
    recommended: '48px' // Better user experience
  },
  tablet: {
    minimum: '44px',
    recommended: '52px'
  },
  desktop: {
    minimum: '32px',    // Mouse precision
    recommended: '40px'
  }
};

// CSS implementation
.mobile-touch-button {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 16px;
}`}
                />

                <CodeBlock
                  title='Safe Area Implementation'
                  code={`// CSS for safe area support
.safe-area-optimized {
  padding-top: max(env(safe-area-inset-top), 0px);
  padding-bottom: max(env(safe-area-inset-bottom), 0px);
  padding-left: max(env(safe-area-inset-left), 0px);
  padding-right: max(env(safe-area-inset-right), 0px);
}

// Mobile navigation with safe area
.mobile-nav-enhanced {
  padding-bottom: max(env(safe-area-inset-bottom), 16px);
}`}
                />
              </div>
            </div>
          </TabsContent>

          {/* Troubleshooting Tab */}
          <TabsContent value='troubleshooting' className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-4'>
                🔧 Common Issues & Solutions
              </h3>

              <div className='space-y-4'>
                <Alert>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Issue:</strong> Layout jumping during breakpoint
                    transitions
                    <br />
                    <strong>Solution:</strong> Use CSS transitions and avoid
                    sudden dimension changes
                  </AlertDescription>
                </Alert>

                <CodeBlock
                  title='Smooth Transition Fix'
                  code={`// Add smooth transitions to prevent layout jumps
.responsive-container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// Avoid sudden size changes
const ResponsiveImage = () => {
  const { isMobile } = useOptimizedResponsive();
  
  return (
    <img 
      src={imageSrc}
      style={{
        width: '100%',
        height: 'auto',
        maxWidth: isMobile ? '100%' : '800px',
        transition: 'max-width 0.3s ease'
      }}
    />
  );
};`}
                />

                <Alert>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Issue:</strong> Excessive re-renders on window
                    resize
                    <br />
                    <strong>Solution:</strong> Increase debounce delay or use
                    CSS-only solutions where possible
                  </AlertDescription>
                </Alert>

                <CodeBlock
                  title='Performance Optimization'
                  code={`// For components that don't need immediate updates
const DEBOUNCE_DELAY = 300; // Increase from default 150ms

// Use CSS classes for simple responsive behavior
<div className="block md:hidden lg:block">
  CSS-only responsive visibility
</div>

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateSomething(responsive.width);
}, [responsive.breakpoint]); // Only recalculate on breakpoint change`}
                />

                <Alert>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Issue:</strong> Touch targets too small on mobile
                    <br />
                    <strong>Solution:</strong> Use mobile-optimized components
                    with minimum 44px touch targets
                  </AlertDescription>
                </Alert>

                <CodeBlock
                  title='Touch Target Fix'
                  code={`// Wrong - Touch targets too small
<button className="p-1 text-sm">Small Button</button>

// Correct - Mobile-optimized touch targets
import { MobileTouchButton } from '@/components/mobile/MobileOptimizedComponents';

<MobileTouchButton size="md">
  Properly Sized Button (48px+ on mobile)
</MobileTouchButton>`}
                />
              </div>
            </div>
          </TabsContent>

          {/* Migration Tab */}
          <TabsContent value='migration' className='space-y-6'>
            <div>
              <h3 className='text-lg font-semibold mb-4'>🔄 Migration Guide</h3>

              <div className='space-y-4'>
                <Alert>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Step 1:</strong> Replace legacy useResponsive with
                    useOptimizedResponsive
                  </AlertDescription>
                </Alert>

                <CodeBlock
                  title='Hook Migration'
                  code={`// Old (Legacy)
import { useResponsive } from '@/hooks/useResponsive';

// New (Optimized)
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';

// API is identical, just replace the import
const { isMobile, isTablet, isDesktop } = useOptimizedResponsive();`}
                />

                <Alert>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Step 2:</strong> Update layout components to use new
                    responsive patterns
                  </AlertDescription>
                </Alert>

                <CodeBlock
                  title='Layout Migration'
                  code={`// Old - Manual responsive logic
const MyComponent = () => {
  const { isMobile } = useResponsive();
  
  if (isMobile) {
    return <div className="mobile-layout">...</div>;
  }
  return <div className="desktop-layout">...</div>;
};

// New - Use responsive layout components
import { ResponsiveLayout } from '@/components/layouts/ResponsiveLayout';

const MyComponent = () => {
  return (
    <ResponsiveLayout>
      <YourContent />
    </ResponsiveLayout>
  );
};`}
                />

                <Alert>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Step 3:</strong> Upgrade to mobile/tablet optimized
                    components
                  </AlertDescription>
                </Alert>

                <CodeBlock
                  title='Component Migration'
                  code={`// Old - Basic responsive button
<button className={isMobile ? 'mobile-btn' : 'desktop-btn'}>
  Click me
</button>

// New - Mobile-optimized component
import { MobileTouchButton } from '@/components/mobile/MobileOptimizedComponents';

<MobileTouchButton variant="primary" size="lg">
  Click me
</MobileTouchButton>`}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
