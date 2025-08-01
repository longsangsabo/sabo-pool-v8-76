import React from 'react';
import { cn } from '@/lib/utils';

// ===== UNIVERSAL TECH COMPONENTS =====

export interface TechCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'premium' | 'active' | 'disabled';
  interactive?: boolean;
}

export const TechCard: React.FC<TechCardProps> = ({
  children,
  className,
  variant = 'default',
  interactive = false,
}) => (
  <div
    className={cn(
      'sabo-tech-card',
      variant === 'premium' && 'tech-card-premium',
      variant === 'active' && 'tech-card-active',
      variant === 'disabled' && 'tech-card-disabled',
      interactive && 'tech-card-interactive',
      className
    )}
  >
    <div className='tech-card-border'></div>
    <div className='tech-card-content'>{children}</div>
    <div className='tech-card-corners'></div>
  </div>
);

export interface TechButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export const TechButton: React.FC<TechButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  fullWidth = false,
}) => (
  <button
    className={cn(
      'sabo-tech-button',
      `tech-btn-${size}`,
      fullWidth && 'tech-btn-full',
      disabled && 'tech-btn-disabled',
      className
    )}
    data-variant={variant}
    onClick={onClick}
    disabled={disabled}
  >
    <div className='tech-btn-border'></div>
    <span className='tech-btn-text'>{children}</span>
    <div className='tech-btn-glow'></div>
  </button>
);

export interface TechInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export const TechInput: React.FC<TechInputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  className,
  disabled = false,
  label,
}) => (
  <div className={cn('sabo-tech-input', className)}>
    {label && <label className='tech-input-label'>{label}</label>}
    <div className='tech-input-wrapper'>
      <div className='tech-input-border'></div>
      <input
        className='tech-input-field'
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      <div className='tech-input-corners'></div>
    </div>
  </div>
);

export interface TechHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}

export const TechHeader: React.FC<TechHeaderProps> = ({
  title,
  subtitle,
  className,
  actions,
}) => (
  <div className={cn('sabo-tech-header', className)}>
    <div className='tech-header-border'></div>
    <div className='tech-header-content'>
      <div className='tech-header-titles'>
        <h1 className='tech-header-title'>{title}</h1>
        {subtitle && <p className='tech-header-subtitle'>{subtitle}</p>}
      </div>
      {actions && <div className='tech-header-actions'>{actions}</div>}
    </div>
    <div className='tech-header-circuit'></div>
  </div>
);

export interface TechNavigationProps {
  items: Array<{
    icon: React.ReactNode;
    label: string;
    path: string;
    active?: boolean;
  }>;
  onNavigate?: (path: string) => void;
}

export const TechNavigation: React.FC<TechNavigationProps> = ({
  items,
  onNavigate,
}) => (
  <div className='sabo-tech-navigation'>
    <div className='tech-nav-border'></div>
    <div className='tech-nav-items'>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn('tech-nav-item', item.active && 'active')}
          onClick={() => onNavigate?.(item.path)}
        >
          <div className='nav-item-glow'></div>
          <div className='nav-item-icon'>{item.icon}</div>
          <span className='nav-item-label'>{item.label}</span>
        </div>
      ))}
    </div>
  </div>
);

export interface TechStatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const TechStatCard: React.FC<TechStatCardProps> = ({
  label,
  value,
  icon,
  variant = 'primary',
  className,
}) => (
  <div className={cn('tech-stat-card', `tech-stat-${variant}`, className)}>
    <div className='tech-stat-border'></div>
    <div className='tech-stat-content'>
      {icon && <div className='tech-stat-icon'>{icon}</div>}
      <div className='tech-stat-value'>{value}</div>
      <div className='tech-stat-label'>{label}</div>
    </div>
    <div className='tech-stat-glow'></div>
  </div>
);

export interface TechListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TechListItem: React.FC<TechListItemProps> = ({
  children,
  onClick,
  active = false,
  className,
  leftIcon,
  rightIcon,
}) => (
  <div
    className={cn(
      'tech-list-item',
      active && 'tech-list-item-active',
      onClick && 'tech-list-item-clickable',
      className
    )}
    onClick={onClick}
  >
    <div className='tech-list-border'></div>
    <div className='tech-list-content'>
      {leftIcon && <div className='tech-list-icon-left'>{leftIcon}</div>}
      <div className='tech-list-main'>{children}</div>
      {rightIcon && <div className='tech-list-icon-right'>{rightIcon}</div>}
    </div>
  </div>
);

export interface TechModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const TechModal: React.FC<TechModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  if (!isOpen) return null;

  return (
    <div className='tech-modal-overlay' onClick={onClose}>
      <div
        className={cn('tech-modal', className)}
        onClick={e => e.stopPropagation()}
      >
        <div className='tech-modal-border'></div>
        <div className='tech-modal-content'>
          {title && (
            <div className='tech-modal-header'>
              <h2 className='tech-modal-title'>{title}</h2>
              <button className='tech-modal-close' onClick={onClose}>
                ×
              </button>
            </div>
          )}
          <div className='tech-modal-body'>{children}</div>
        </div>
      </div>
    </div>
  );
};
