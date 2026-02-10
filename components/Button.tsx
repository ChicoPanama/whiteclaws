'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = [
      'wc-btn',
      `wc-btn-${variant}`,
      `wc-btn-${size}`,
      fullWidth ? 'wc-btn-full' : '',
      className || '',
    ].filter(Boolean).join(' ');

    return (
      <button ref={ref} className={classes} disabled={disabled || isLoading} {...props}>
        {isLoading && <span className="ap-spinner" style={{ width: 16, height: 16, marginRight: 8 }} />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
