import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main', 'core']));

  // Group items by section
  const groupedItems = items.reduce((acc, item) => {
    const section = item.section || 'main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

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
      case 'emergency':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'system':
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'management':
        return 'border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20';
      default:
        return '';
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            userRole === 'admin' ? 'bg-red-500' :
            userRole === 'club' ? 'bg-purple-500' : 'bg-primary'
          )}>
            <span className="text-white font-bold text-sm">
              {userRole === 'admin' ? 'A' : userRole === 'club' ? 'C' : 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">
                {userRole === 'admin' ? 'Admin Panel' :
                 userRole === 'club' ? 'Club Management' : 'SABO Arena'}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {userRole === 'admin' ? 'Quản trị hệ thống' :
                 userRole === 'club' ? 'Quản lý câu lạc bộ' : 'Billiards Community'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-2">
          {Object.entries(groupedItems).map(([sectionKey, sectionItems]) => {
            const sectionLabel = sections[sectionKey] || sectionKey;
            const isExpanded = expandedSections.has(sectionKey);
            const hasMultipleSections = Object.keys(groupedItems).length > 1;

            if (collapsed) {
              // Collapsed mode - show icons only
              return (
                <div key={sectionKey} className="space-y-1">
                  {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center justify-center w-12 h-12 rounded-lg transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                        title={item.label}
                      >
                        <Icon className="w-5 h-5" />
                      </NavLink>
                    );
                  })}
                </div>
              );
            }

            // Expanded mode
            return (
              <div key={sectionKey} className={cn("space-y-1", getSectionStyle(sectionKey))}>
                {hasMultipleSections && (
                  <Collapsible 
                    open={isExpanded} 
                    onOpenChange={() => toggleSection(sectionKey)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-xs font-semibold text-muted-foreground hover:text-foreground p-2 h-8"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 mr-2" />
                        ) : (
                          <ChevronRight className="w-3 h-3 mr-2" />
                        )}
                        {sectionLabel}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1">
                      {sectionItems.map((item) => (
                        <NavigationLink key={item.path} item={item} isActive={isActive(item.path)} />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}
                
                {!hasMultipleSections && sectionItems.map((item) => (
                  <NavigationLink key={item.path} item={item} isActive={isActive(item.path)} />
                ))}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p>SABO Arena v1.0</p>
            <p>Role: {userRole.toUpperCase()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Separate component for navigation links
const NavigationLink: React.FC<{ item: NavigationItem; isActive: boolean }> = ({ 
  item, 
  isActive 
}) => {
  const Icon = item.icon;
  
  return (
    <NavLink
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="truncate">{item.label}</div>
        {item.description && (
          <div className="text-xs opacity-70 truncate">{item.description}</div>
        )}
      </div>
      
      {/* Badge for notifications */}
      {item.badge && (
        <Badge
          variant="destructive"
          className="ml-auto w-5 h-5 text-xs p-0 flex items-center justify-center"
        >
          !
        </Badge>
      )}
    </NavLink>
  );
};
