import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';

interface TermsCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const TermsCheckbox = ({
  checked,
  onCheckedChange,
  disabled,
}: TermsCheckboxProps) => (
  <div className='flex items-start space-x-3'>
    <Checkbox
      id='terms'
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className='mt-0.5'
    />
    <label htmlFor='terms' className='text-sm text-gray-600 leading-tight'>
      Tôi đồng ý với{' '}
      <Link
        to='/terms'
        target='_blank'
        className='text-blue-600 hover:text-blue-800 underline'
      >
        Điều khoản sử dụng
      </Link>{' '}
      và{' '}
      <Link
        to='/privacy'
        target='_blank'
        className='text-blue-600 hover:text-blue-800 underline'
      >
        Chính sách bảo mật
      </Link>
    </label>
  </div>
);
