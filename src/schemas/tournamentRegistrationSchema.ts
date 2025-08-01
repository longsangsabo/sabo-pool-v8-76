import { z } from 'zod';

// Tournament registration validation schema
export const tournamentRegistrationSchema = z.object({
  // Tournament selection
  tournament_id: z.string().min(1, 'Vui lòng chọn giải đấu'),

  // Personal information
  player_name: z
    .string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được vượt quá 100 ký tự'),

  phone: z
    .string()
    .min(10, 'Số điện thoại phải có ít nhất 10 số')
    .max(15, 'Số điện thoại không được vượt quá 15 số')
    .regex(/^[\d\s\+\-\(\)]+$/, 'Số điện thoại không hợp lệ'),

  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),

  current_rank: z.string().min(1, 'Vui lòng chọn hạng hiện tại'),

  // Age verification
  age: z
    .number()
    .min(16, 'Phải từ 16 tuổi trở lên để tham gia')
    .max(80, 'Tuổi không hợp lệ'),

  // Emergency contact
  emergency_contact: z
    .string()
    .min(10, 'Số điện thoại liên hệ khẩn cấp là bắt buộc')
    .optional(),

  // Agreement and terms
  agree_terms: z
    .boolean()
    .refine(val => val === true, 'Bạn phải đồng ý với điều lệ giải đấu'),

  agree_rules: z
    .boolean()
    .refine(val => val === true, 'Bạn phải đồng ý với quy tắc thi đấu'),

  // Payment method
  payment_method: z.enum(['vnpay', 'cash', 'transfer'], {
    required_error: 'Vui lòng chọn phương thức thanh toán',
  }),

  // Additional notes
  notes: z
    .string()
    .max(500, 'Ghi chú không được vượt quá 500 ký tự')
    .optional(),

  // Previous tournament experience
  tournament_experience: z.enum(['beginner', 'intermediate', 'experienced'], {
    required_error: 'Vui lòng chọn kinh nghiệm thi đấu',
  }),
});

export type TournamentRegistrationFormData = z.infer<
  typeof tournamentRegistrationSchema
>;

// Available ranks for registration
export const REGISTRATION_RANKS = [
  { value: 'E+', label: 'Chuyên nghiệp tiến bộ (E+)' },
  { value: 'E', label: 'Chuyên nghiệp (E)' },
  { value: 'F+', label: 'Xuất sắc tiến bộ (F+)' },
  { value: 'F', label: 'Xuất sắc (F)' },
  { value: 'G+', label: 'Giỏi tiến bộ (G+)' },
  { value: 'G', label: 'Giỏi (G)' },
  { value: 'H+', label: 'Khá tiến bộ (H+)' },
  { value: 'H', label: 'Khá (H)' },
  { value: 'I+', label: 'Trung bình tiến bộ (I+)' },
  { value: 'I', label: 'Trung bình (I)' },
  { value: 'K+', label: 'Người mới tiến bộ (K+)' },
  { value: 'K', label: 'Người mới (K)' },
];

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'vnpay', label: 'VNPAY (Thẻ ATM/Visa/Master)', icon: '💳' },
  { value: 'cash', label: 'Tiền mặt tại địa điểm', icon: '💵' },
  { value: 'transfer', label: 'Chuyển khoản ngân hàng', icon: '🏦' },
];

// Tournament experience levels
export const EXPERIENCE_LEVELS = [
  {
    value: 'beginner',
    label: 'Mới bắt đầu (1-5 giải)',
    description: 'Ít kinh nghiệm thi đấu chính thức',
  },
  {
    value: 'intermediate',
    label: 'Trung bình (6-20 giải)',
    description: 'Có kinh nghiệm thi đấu cơ bản',
  },
  {
    value: 'experienced',
    label: 'Giàu kinh nghiệm (>20 giải)',
    description: 'Thường xuyên tham gia giải đấu',
  },
];

// Default form values
export const getDefaultRegistrationData =
  (): Partial<TournamentRegistrationFormData> => ({
    tournament_id: '',
    player_name: '',
    phone: '',
    email: '',
    current_rank: '',
    age: 18,
    emergency_contact: '',
    agree_terms: false,
    agree_rules: false,
    payment_method: 'vnpay',
    notes: '',
    tournament_experience: 'intermediate',
  });
