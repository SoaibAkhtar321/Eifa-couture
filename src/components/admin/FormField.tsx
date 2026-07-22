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

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Numeric input for prices, stock quantities, etc. Renders a plain
 * `<input type="number">` — pairing with zod's `z.coerce.number()` in
 * `lib/admin/validation.ts` handles the string→number conversion on
 * submit, so this stays a thin, uncontrolled-friendly wrapper.
 */
export function NumberField({ label, error, hint, required, id, className, ...props }: NumberFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
      <input
        id={fieldId}
        type="number"
        required={required}
        className={`${baseFieldClass} ${error ? 'border-red-400' : ''} ${className ?? ''}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface DateTimeFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Local datetime picker for scheduling windows (e.g. collection
 * `starts_at`/`ends_at`). Renders a plain `<input type="datetime-local">`
 * — callers convert to/from ISO strings at the form boundary, same
 * division of labor as `NumberField`.
 */
export function DateTimeField({ label, error, hint, required, id, className, ...props }: DateTimeFieldProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <FieldWrapper label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
      <input
        id={fieldId}
        type="datetime-local"
        required={required}
        className={`${baseFieldClass} ${error ? 'border-red-400' : ''} ${className ?? ''}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * On/off switch for boolean flags (featured, active, etc.). Deliberately
 * takes a `checked`/`onChange(boolean)` pair rather than spreading raw
 * input props — every call site in ProductForm/VariantForm wants a
 * controlled boolean, not a change event, and this keeps that intent
 * explicit at the call site.
 */
export function ToggleField({ label, checked, onChange, hint, id, disabled }: ToggleFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-charcoal">
          {label}
        </label>
        {hint && <p className="text-xs text-charcoal/50">{hint}</p>}
      </div>
      <button
        id={fieldId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-maroon/30 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-maroon' : 'bg-charcoal/20'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-ivory shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
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