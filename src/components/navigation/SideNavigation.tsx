import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { NavigationItem, NAVIGATION_SECTIONS } from './navigationConfig';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SideNavigationProps {
  userRole: 'user' | 'club' | 'admin';
  items: NavigationItem[];
  collapsed?: boolean;
}

export const SideNavigation: React.FC<SideNavigationProps> = ({
  userRole,
  items,
  collapsed = false,
}) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['hubs', 'extended', 'quick'])
  );

  // Group items by section
  const groupedItems = items.reduce(
    (acc, item) => {
      const section = item.section || 'main';
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, NavigationItem[]>
  );

  const sections = NAVIGATION_SECTIONS[userRole] || {};

  const isActive = (path: string) => {
    if (path === '/' || path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionStyle = (sectionKey: string) => {
    switch (sectionKey) {
      case 'hubs':
        return 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent';
      case 'extended':
        return 'border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 dark:to-transparent';
      case 'quick':
        return 'border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent';
      case 'emergency':
        return 'border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/20 dark:to-transparent';
      case 'system':
        return 'border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/20 dark:to-transparent';
      case 'management':
        return 'border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50 to-transparent dark:from-indigo-900/20 dark:to-transparent';
      default:
        return 'border-l-4 border-gray-300 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900/20 dark:to-transparent';
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Header */}
      <div className='p-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent'>
        <div className='flex items-center gap-2'>
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-all duration-300',
              userRole === 'admin'
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : userRole === 'club'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
            )}
          >
            <span className='text-white font-bold text-xs'>
              {userRole === 'admin' ? 'A' : userRole === 'club' ? 'C' : 'SA'}
            </span>
          </div>
          {!collapsed && (
            <div className='flex-1 min-w-0'>
              <h2 className='font-bold text-base truncate bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent'>
                {userRole === 'admin'
                  ? 'Admin Panel'
                  : userRole === 'club'
                    ? 'Club Management'
                    : 'SABO Arena'}
              </h2>
              <p className='text-xs text-muted-foreground/80 truncate'>
                {userRole === 'admin'
                  ? 'Quản trị hệ thống'
                  : userRole === 'club'
                    ? 'Quản lý câu lạc bộ'
                    : 'Premium Billiards Experience'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className='flex-1'>
        <nav className='p-2 space-y-2'>
          {Object.entries(groupedItems).map(([sectionKey, sectionItems]) => {
            const sectionLabel = sections[sectionKey] || sectionKey;
            const isExpanded = expandedSections.has(sectionKey);
            const hasMultipleSections = Object.keys(groupedItems).length > 1;

            if (collapsed) {
              // Collapsed mode - show icons only with enhanced tooltips
              return (
                <div key={sectionKey} className='space-y-2'>
                  {sectionItems.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200',
                          'hover:bg-accent hover:text-accent-foreground hover:scale-110 hover:shadow-lg',
                          active
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                            : 'text-muted-foreground'
                        )}
                        title={`${item.label}${item.description ? ' - ' + item.description : ''}`}
                      >
                        <Icon className={cn(
                          'w-5 h-5 transition-all duration-200',
                          active ? 'scale-110' : 'group-hover:scale-110'
                        )} />
                        
                        {/* Badge indicator for collapsed mode */}
                        {item.badge && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        )}
                        
                        {/* Active indicator */}
                        {active && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              );
            }

            // Expanded mode
            return (
              <div
                key={sectionKey}
                className={cn('space-y-1', getSectionStyle(sectionKey))}
              >
                {hasMultipleSections && (
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleSection(sectionKey)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant='ghost'
                        className='w-full justify-start text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent/50 p-3 h-auto rounded-lg transition-all duration-200'
                      >
                        <div className='flex items-center w-full'>
                          {isExpanded ? (
                            <ChevronDown className='w-3 h-3 mr-2 transition-transform duration-200' />
                          ) : (
                            <ChevronRight className='w-3 h-3 mr-2 transition-transform duration-200' />
                          )}
                          <span className='flex-1 text-left'>{sectionLabel}</span>
                          <div className='text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full'>
                            {sectionItems.length}
                          </div>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className='space-y-1'>
                      {sectionItems.map(item => (
                        <NavigationLink
                          key={item.path}
                          item={item}
                          isActive={isActive(item.path)}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {!hasMultipleSections &&
                  sectionItems.map(item => (
                    <NavigationLink
                      key={item.path}
                      item={item}
                      isActive={isActive(item.path)}
                    />
                  ))}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className='p-4 border-t border-border bg-gradient-to-r from-muted/50 to-transparent'>
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-xs'>
              <span className='font-semibold text-primary'>SABO Arena</span>
              <span className='px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium'>
                v2.0
              </span>
            </div>
            
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <div className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                userRole === 'admin' ? 'bg-red-500' : 
                userRole === 'club' ? 'bg-purple-500' : 'bg-green-500'
              )} />
              <span>Role: {userRole.toUpperCase()}</span>
            </div>
            
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>7 Hubs Active</span>
              <span>🔥 Premium</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Separate component for navigation links with enhanced styling
const NavigationLink: React.FC<{ item: NavigationItem; isActive: boolean }> = ({
  item,
  isActive,
}) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden',
        'hover:bg-accent/50 hover:text-accent-foreground hover:shadow-sm',
        isActive
          ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/25'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50" />
      )}
      
      <Icon className={cn(
        'w-4 h-4 shrink-0 transition-all duration-200',
        isActive ? 'text-primary-foreground' : 'group-hover:scale-105'
      )} />
      
      <div className='flex-1 min-w-0 relative z-10'>
        <div className='truncate font-semibold'>{item.label}</div>
        {item.description && (
          <div className={cn(
            'text-xs opacity-70 truncate transition-opacity duration-200',
            isActive ? 'text-primary-foreground/80' : 'text-muted-foreground group-hover:opacity-90'
          )}>
            {item.description}
          </div>
        )}
      </div>

      {/* Badge for notifications */}
      {item.badge && (
        <div className='relative'>
          <Badge
            variant={isActive ? 'secondary' : 'destructive'}
            className={cn(
              'ml-auto w-6 h-6 text-xs p-0 flex items-center justify-center animate-pulse',
              isActive ? 'bg-primary-foreground/20 text-primary-foreground' : ''
            )}
          >
            •
          </Badge>
          {/* Pulsing ring for urgent notifications */}
          <div className="absolute -inset-1 bg-red-400 rounded-full animate-ping opacity-20" />
        </div>
      )}
    </NavLink>
  );
};
