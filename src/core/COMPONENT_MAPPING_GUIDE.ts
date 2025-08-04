// =============================================================================
// COMPONENT MAPPING GUIDE
// =============================================================================
// This file will be used to map existing components to the new foundation structure
// Each team member should update their section after cleanup

interface ComponentMapping {
  foundation: string;           // New foundation component path
  existing?: string;           // Current existing component path
  status: 'pending' | 'mapped' | 'created';
  assignedTo?: string;         // Team member responsible
  notes?: string;
}

export const COMPONENT_MAPPINGS: Record<string, ComponentMapping> = {
  
  // =============================================================================
  // LAYOUTS - Foundation components created, need mapping to existing
  // =============================================================================
  'UserLayout': {
    foundation: '@/shared/layouts/UserLayout',
    existing: '@/components/layouts/ResponsiveLayout', // Example - update with actual
    status: 'pending',
    assignedTo: 'PERSON3',
    notes: 'Map to existing user layout component'
  },
  
  'AdminLayout': {
    foundation: '@/shared/layouts/AdminLayout', 
    existing: '@/components/layouts/AdminResponsiveLayout',
    status: 'pending',
    assignedTo: 'PERSON1',
    notes: 'Map to existing admin layout'
  },
  
  'ClubLayout': {
    foundation: '@/shared/layouts/ClubLayout',
    existing: '@/components/layouts/ClubResponsiveLayout', // Example
    status: 'pending', 
    assignedTo: 'PERSON2',
    notes: 'Map to existing club layout'
  },

  // =============================================================================
  // NAVIGATION - Foundation created, need mapping
  // =============================================================================
  'UserNavigation': {
    foundation: '@/shared/components/navigation/UserNavigation',
    existing: undefined, // To be identified
    status: 'pending',
    assignedTo: 'PERSON3',
    notes: 'Map to existing user navigation or create new'
  },

  'AdminNavigation': {
    foundation: '@/shared/components/navigation/AdminNavigation',
    existing: undefined, // To be identified  
    status: 'pending',
    assignedTo: 'PERSON1',
    notes: 'Map to existing admin navigation'
  },

  'ClubNavigation': {
    foundation: '@/shared/components/navigation/ClubNavigation', 
    existing: undefined, // To be identified
    status: 'pending',
    assignedTo: 'PERSON2',
    notes: 'Map to existing club navigation'
  },

  // =============================================================================
  // PAGES - To be mapped by each team member
  // =============================================================================
  
  // PERSON1 - Admin Pages
  'AdminDashboard': {
    foundation: '/admin',
    existing: undefined, // PERSON1 to update
    status: 'pending',
    assignedTo: 'PERSON1'
  },
  
  'AdminUsers': {
    foundation: '/admin/users',
    existing: undefined, // PERSON1 to update  
    status: 'pending',
    assignedTo: 'PERSON1'
  },

  // PERSON2 - Club & Tournament Pages
  'ClubDashboard': {
    foundation: '/club/dashboard',
    existing: undefined, // PERSON2 to update
    status: 'pending', 
    assignedTo: 'PERSON2'
  },
  
  'TournamentManagement': {
    foundation: '/club/management/tournaments',
    existing: undefined, // PERSON2 to update
    status: 'pending',
    assignedTo: 'PERSON2'
  },

  // PERSON3 - User & Challenge Pages  
  'UserDashboard': {
    foundation: '/user/dashboard',
    existing: '@/pages/UnifiedDashboard', // Example
    status: 'pending',
    assignedTo: 'PERSON3'
  },
  
  'UserChallenges': {
    foundation: '/user/challenges', 
    existing: '@/pages/EnhancedChallengesPageV2', // Example
    status: 'pending',
    assignedTo: 'PERSON3'
  },

  // =============================================================================
  // SHARED COMPONENTS - Common components used across features
  // =============================================================================
  'AuthPage': {
    foundation: '/auth',
    existing: '@/pages/AuthPage',
    status: 'pending',
    notes: 'Shared authentication component'
  },

  'TournamentsPage': {
    foundation: '/tournaments',
    existing: '@/pages/TournamentsPage',
    status: 'pending', 
    notes: 'Public tournaments page'
  },

  'ClubsPage': {
    foundation: '/clubs',
    existing: '@/pages/ClubsPage', 
    status: 'pending',
    notes: 'Public clubs listing'
  }
};

// =============================================================================
// INSTRUCTIONS FOR EACH TEAM MEMBER
// =============================================================================

export const TEAM_INSTRUCTIONS = {
  'PERSON1': {
    focus: 'Admin Features',
    routes: ['/admin/*'],
    tasks: [
      '1. Update AdminLayout mapping to existing admin layout component',
      '2. Map admin page components to foundation routes',
      '3. Update AdminNavigation with existing admin menu items',
      '4. Test admin routing and permissions'
    ]
  },

  'PERSON2': {
    focus: 'Club & Tournament Features', 
    routes: ['/club/*', '/tournaments'],
    tasks: [
      '1. Update ClubLayout mapping to existing club layout',
      '2. Map club management pages to foundation routes', 
      '3. Map tournament pages to both public and club routes',
      '4. Update ClubNavigation with existing menu items'
    ]
  },

  'PERSON3': {
    focus: 'User & Challenge Features',
    routes: ['/user/*'],
    tasks: [
      '1. Update UserLayout mapping to existing user layout',
      '2. Map user dashboard and profile pages',
      '3. Map challenge system to /user/challenges',
      '4. Update UserNavigation with existing menu items'
    ]
  }
};

export default COMPONENT_MAPPINGS;
