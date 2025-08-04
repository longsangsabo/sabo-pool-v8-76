import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TournamentForm } from '../components/tournament/TournamentForm';

// Mock UI components  
jest.mock('@/components/ui/form', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/input', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/button', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/select', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/card', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/calendar', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/popover', () => require('../__mocks__/ui'));
jest.mock('@/components/ui/textarea', () => require('../__mocks__/ui'));

describe('TournamentForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<TournamentForm clubId="1" onSuccess={mockOnSuccess} />);
    
    expect(screen.getByLabelText('Tên giải đấu')).toBeInTheDocument();
    expect(screen.getByLabelText('Mô tả')).toBeInTheDocument();
    expect(screen.getByLabelText('Ngày bắt đầu')).toBeInTheDocument();
    expect(screen.getByLabelText('Thể thức')).toBeInTheDocument();
    expect(screen.getByLabelText('Thể thức trận đấu')).toBeInTheDocument();
    expect(screen.getByLabelText('Số người tham gia tối đa')).toBeInTheDocument();
    expect(screen.getByLabelText('Phí tham gia')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<TournamentForm clubId="1" onSuccess={mockOnSuccess} />);
    
    fireEvent.click(screen.getByText('Tạo giải đấu'));
    
    await waitFor(() => {
      expect(screen.getByText('Tên giải đấu không được để trống')).toBeInTheDocument();
      expect(screen.getByText('Vui lòng chọn ngày bắt đầu')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1' })
    });
    global.fetch = mockFetch;

    render(<TournamentForm clubId="1" onSuccess={mockOnSuccess} />);
    
    fireEvent.change(screen.getByLabelText('Tên giải đấu'), {
      target: { value: 'Test Tournament' }
    });

    // Set start date
    fireEvent.click(screen.getByText('Chọn ngày'));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(new Date().getDate().toString()) }));

    // Select format
    fireEvent.click(screen.getByLabelText('Thể thức'));
    fireEvent.click(screen.getByText('Loại trực tiếp'));

    // Submit form
    fireEvent.click(screen.getByText('Tạo giải đấu'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/clubs/1/tournaments', expect.any(Object));
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'));
    global.fetch = mockFetch;

    render(<TournamentForm clubId="1" onSuccess={mockOnSuccess} />);
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Tên giải đấu'), {
      target: { value: 'Test Tournament' }
    });
    fireEvent.click(screen.getByText('Tạo giải đấu'));

    await waitFor(() => {
      expect(mockOnSuccess).not.toHaveBeenCalled();
      // Check if error is handled/displayed
    });
  });
});
