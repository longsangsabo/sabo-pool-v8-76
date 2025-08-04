import { render, screen, fireEvent } from '@testing-library/react';
import { MemberCard } from '../components/members/MemberCard';
import { ClubMember } from '../types/member.types';

// Mock UI components
jest.mock('@/components/ui/card', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/avatar', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/badge', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/button', () => require('../__mocks__/ui'));

const mockMember: ClubMember = {
  id: '1',
  user_id: '1',
  club_id: '1',
  role: 'member',
  joined_at: '2025-01-01',
  status: 'active',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  club: {
    id: '1',
    name: 'Test Club',
    owner_id: '1',
    description: 'A test club',
    status: 'active',
    created_at: '2025-01-01',
    updated_at: '2025-01-01'
  }
};

describe('MemberCard', () => {
  it('renders member information correctly', () => {
    render(<MemberCard member={mockMember} />);
    
    expect(screen.getByText('Thành viên từ: 1/1/2025')).toBeInTheDocument();
    expect(screen.getByText('Chưa xác thực')).toBeInTheDocument();
  });

  it('calls onViewDetails when view details button is clicked', () => {
    const onViewDetails = jest.fn();
    render(<MemberCard member={mockMember} onViewDetails={onViewDetails} />);
    
    fireEvent.click(screen.getByText('Chi tiết'));
    expect(onViewDetails).toHaveBeenCalledWith(mockMember.id);
  });

  it('calls onMessage when message button is clicked', () => {
    const onMessage = jest.fn();
    render(<MemberCard member={mockMember} onMessage={onMessage} />);
    
    fireEvent.click(screen.getByText('Nhắn tin'));
    expect(onMessage).toHaveBeenCalledWith(mockMember.id);
  });

  it('shows correct membership duration', () => {
    render(<MemberCard member={mockMember} />);
    
    const joinDate = new Date(mockMember.joined_at).toLocaleDateString('vi-VN');
    expect(screen.getByText(`Thành viên từ: ${joinDate}`)).toBeInTheDocument();
  });
});
