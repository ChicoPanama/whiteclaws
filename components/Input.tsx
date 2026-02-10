'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="sf-field">
        {label && (
          <label className="sf-label">
            {label}
            {props.required && <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`sf-input ${error ? 'sf-input-error' : ''} ${className || ''}`}
          {...props}
        />
        {error && <p className="wc-field-error">{error}</p>}
        {helperText && !error && <p className="wc-field-helper">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
