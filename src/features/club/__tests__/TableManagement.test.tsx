import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TableManagement } from '../components/table/TableManagement';
import { useClubRole } from '@/hooks/useClubRole';

// Mock UI components
jest.mock('@/components/ui/table', () => require('../__mocks__/ui')); 
jest.mock('@/components/ui/button', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/select', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/input', () => require('../__mocks__/ui'));

// Mock hooks
jest.mock('../hooks/useClubRole', () => ({
  useClubRole: jest.fn().mockReturnValue({
    permissions: {
      canCreateTable: true,
      canUpdateTable: true,
      canDeleteTable: true
    }
  })
}));

describe('TableManagement', () => {
  const mockPermissions = {
    canManageClub: true,
    canManageMembers: true,
    canManageTournaments: true,
    canVerifyRanks: true
  };

  beforeEach(() => {
    (useClubRole as jest.Mock).mockReturnValue({ permissions: mockPermissions });
  });

  it('renders table management title', () => {
    render(<TableManagement clubId="1" />);
    expect(screen.getByText('Quản lý bàn chơi')).toBeInTheDocument();
  });

  it('shows add table button when user has permissions', () => {
    render(<TableManagement clubId="1" />);
    expect(screen.getByText('Thêm bàn mới')).toBeInTheDocument();
  });

  it('hides add table button when user lacks permissions', () => {
    (useClubRole as jest.Mock).mockReturnValue({
      permissions: { ...mockPermissions, canManageClub: false }
    });
    render(<TableManagement clubId="1" />);
    expect(screen.queryByText('Thêm bàn mới')).not.toBeInTheDocument();
  });

  it('toggles between grid and list views', () => {
    render(<TableManagement clubId="1" />);
    
    // Default view should be grid
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Grid View');
    
    // Switch to list view
    fireEvent.click(screen.getByText('List View'));
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('List View');
  });

  it('opens add table dialog when button is clicked', async () => {
    render(<TableManagement clubId="1" />);
    
    fireEvent.click(screen.getByText('Thêm bàn mới'));
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Thêm bàn mới')).toBeInTheDocument();
    });
  });
});
