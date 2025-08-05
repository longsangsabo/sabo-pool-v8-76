// Mock Supabase for testing
export const mockSupabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => Promise.resolve({ data: [], error: null }),
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
  },
};

// Mock exports for tests
export const setupSupabaseMocks = () => {

};

export const mockToast = {

};

export const mockTournaments = [
  { id: '1', name: 'Test Tournament', status: 'upcoming' },
];

export const mockUsers = [
  { id: '1', email: 'test@example.com', full_name: 'Test User' },
];
