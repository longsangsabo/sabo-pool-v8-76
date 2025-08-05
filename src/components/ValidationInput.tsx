import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ValidationInputProps {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  validation?: (value: string) => string | null;
  placeholder?: string;
  required?: boolean;
}

export const ValidationInput = ({
  id,
  type,
  label,
  value,
  onChange,
  validation,
  placeholder,
  required = false,
}: ValidationInputProps) => {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    if (validation) {
      const errorMessage = validation(value);
      setError(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (touched && validation) {
      const errorMessage = validation(newValue);
      setError(errorMessage);
    }
  };

  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={error ? 'border-red-500' : ''}
      />
      {error && touched && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  );
};
