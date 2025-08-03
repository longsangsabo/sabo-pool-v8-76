import React from 'react';
import { UnifiedNavigation } from '@/components/navigation/UnifiedNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Tablet, Check, X } from 'lucide-react';

/**
 * Navigation Testing Dashboard
 * - Shows current navigation system
 * - Demonstrates responsive behavior
 * - Tests all user roles
 */
const NavigationTestPage: React.FC = () => {
  return (
    <UnifiedNavigation>
      <div className="container mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">🧭 Navigation System Test</h1>
          <p className="text-lg text-muted-foreground">
            Testing the new unified navigation system across all roles and devices
          </p>
          <Badge variant="secondary" className="text-sm">
            Standardization Phase 1
          </Badge>
        </div>

        {/* Device Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Mobile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Mobile (&lt; 768px)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">TopBar + User Menu</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Bottom Navigation (5 tabs)</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span className="text-sm">No Sidebar</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Safe Area Support</span>
              </div>
            </CardContent>
          </Card>

          {/* Tablet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tablet className="w-5 h-5" />
                Tablet (768px - 1024px)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">TopBar + Search</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Sidebar Navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span className="text-sm">No Bottom Nav</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Collapsible Sections</span>
              </div>
            </CardContent>
          </Card>

          {/* Desktop */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Desktop (≥ 1024px)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Full TopBar + Search</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Full Sidebar + Sections</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span className="text-sm">No Bottom Nav</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Hover Effects</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-based Navigation */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">🔐 Role-based Navigation</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* User Role */}
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">👤 Regular User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>✅ Dashboard/Home</div>
                  <div>⚔️ Challenges (with badge)</div>
                  <div>🏆 Tournaments</div>
                  <div>📊 Leaderboard</div>
                  <div>👤 Profile</div>
                  <div className="text-muted-foreground">+ Calendar, Wallet, Settings</div>
                </div>
              </CardContent>
            </Card>

            {/* Club Owner */}
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">🏢 Club Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>📊 Club Dashboard</div>
                  <div>🏆 Club Tournaments</div>
                  <div>👥 Members Management</div>
                  <div>📅 Schedule</div>
                  <div>⚙️ Club Settings</div>
                  <div className="text-muted-foreground">+ User features</div>
                </div>
              </CardContent>
            </Card>

            {/* Admin */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">⚡ System Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>📊 Admin Dashboard</div>
                  <div>👥 User Management</div>
                  <div>🏆 Tournament Admin</div>
                  <div>🏢 Club Management</div>
                  <div>🔧 System Settings</div>
                  <div className="text-muted-foreground">+ 15 more admin tools</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Migration Progress */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Migration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✅ Phase 1: Core System (Completed)</h4>
                <div className="ml-4 space-y-1 text-sm">
                  <div>✅ UnifiedNavigation.tsx</div>
                  <div>✅ TopBar.tsx</div>
                  <div>✅ SideNavigation.tsx</div>
                  <div>✅ BottomNavigation.tsx (Updated)</div>
                  <div>✅ navigationConfig.ts</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-yellow-600">🔧 Phase 2: Integration (In Progress)</h4>
                <div className="ml-4 space-y-1 text-sm">
                  <div>🔧 Update RoleBasedLayout.tsx</div>
                  <div>🔧 Update ResponsiveLayout.tsx</div>
                  <div>⏳ Test all navigation flows</div>
                  <div>⏳ Update route handling</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-500">⏳ Phase 3: Cleanup (Pending)</h4>
                <div className="ml-4 space-y-1 text-sm">
                  <div>❌ Remove Navigation.tsx</div>
                  <div>❌ Remove mobile/MobileNavigation.tsx</div>
                  <div>❌ Remove desktop/DesktopNavigation.tsx</div>
                  <div>❌ Remove AdminSidebar.tsx</div>
                  <div>❌ Remove 8+ duplicate components</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>💪 Benefits of Unified System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">🎯 Developer Experience</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Single source of truth</li>
                  <li>• Consistent API across roles</li>
                  <li>• Easier to maintain</li>
                  <li>• Better TypeScript support</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">👥 User Experience</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Consistent behavior</li>
                  <li>• Better performance</li>
                  <li>• Smoother transitions</li>
                  <li>• Less confusion</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-primary">🧪 How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>1. <strong>Resize browser window</strong> to see responsive behavior</div>
              <div>2. <strong>Check mobile view</strong> (&lt; 768px) - Should show bottom navigation</div>
              <div>3. <strong>Check desktop view</strong> (≥ 1024px) - Should show sidebar</div>
              <div>4. <strong>Navigate between pages</strong> - Active states should work</div>
              <div>5. <strong>Test user roles</strong> - Different navigation items per role</div>
              <div>6. <strong>Check badges</strong> - Notification/challenge counts</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedNavigation>
  );
};

export default NavigationTestPage;
