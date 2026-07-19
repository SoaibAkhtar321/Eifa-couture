'use client';

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldWrapper({ label, htmlFor, error, hint, required, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-charcoal">
        {label}
        {required && <span className="text-maroon ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-charcoal/50">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const baseFieldClass =
  'w-full rounded-md border border-charcoal/15 bg-ivory px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-maroon/30 focus:border-maroon transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, required, id, className, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
      <input
        id={fieldId}
        required={required}
        className={`${baseFieldClass} ${error ? 'border-red-400' : ''} ${className ?? ''}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextareaField({
  label,
  error,
  hint,
  required,
  id,
  className,
  ...props
}: TextareaFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
      <textarea
        id={fieldId}
        required={required}
        rows={4}
        className={`${baseFieldClass} resize-y ${error ? 'border-red-400' : ''} ${className ?? ''}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  placeholder?: string;
}

export function SelectField({
  label,
  options,
  error,
  hint,
  required,
  id,
  className,
  placeholder,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
      <select
        id={fieldId}
        required={required}
        className={`${baseFieldClass} ${error ? 'border-red-400' : ''} ${className ?? ''}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
}