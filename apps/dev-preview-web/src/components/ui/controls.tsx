import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { classNames } from './class-names.js';
import styles from './ui.module.css';

type ButtonTone = 'primary' | 'secondary' | 'quiet' | 'danger';
type ButtonSize = 'default' | 'compact';

function buttonClasses(tone: ButtonTone, size: ButtonSize, className?: string): string {
  return classNames(styles.button, styles[tone], styles[size], className);
}

export const Button = forwardRef<HTMLButtonElement, Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: ButtonTone;
    size?: ButtonSize;
  }
>>(function Button({ tone = 'secondary', size = 'default', className, type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={buttonClasses(tone, size, className)} {...props} />;
});

export function ButtonLink({
  to,
  state,
  children,
  tone = 'secondary',
  size = 'default',
  className,
  newRepairTrigger = false,
}: Readonly<{
  to: string;
  state?: unknown;
  children: React.ReactNode;
  tone?: ButtonTone;
  size?: ButtonSize;
  className?: string | undefined;
  newRepairTrigger?: boolean;
}>): React.JSX.Element {
  return <Link to={to} state={state} data-new-repair-trigger={newRepairTrigger || undefined} className={buttonClasses(tone, size, className)}>{children}</Link>;
}

export const IconButton = forwardRef<HTMLButtonElement, Readonly<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
    label: string;
    icon: LucideIcon;
    size?: 16 | 20 | 24;
    tone?: 'default' | 'inverse';
    tooltip?: string;
  }
>>(function IconButton({ label, icon: Icon, size = 20, tone = 'default', tooltip, className, type = 'button', ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={tooltip}
      className={classNames(styles.iconButton, tone === 'inverse' && styles.iconButtonInverse, className)}
      {...props}
    >
      <Icon aria-hidden="true" size={size} />
    </button>
  );
});

export const Input = forwardRef<HTMLInputElement, Readonly<InputHTMLAttributes<HTMLInputElement>>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={classNames(styles.input, className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, Readonly<SelectHTMLAttributes<HTMLSelectElement>>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={classNames(styles.input, styles.select, className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, Readonly<TextareaHTMLAttributes<HTMLTextAreaElement>>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={classNames(styles.input, styles.textarea, className)} {...props} />;
  },
);

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
  fullWidth = false,
  className,
}: Readonly<{
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string | undefined;
}>): React.JSX.Element {
  const descriptionId = hint || error ? `${id}-description` : undefined;
  return (
    <div className={classNames(styles.field, fullWidth && styles.fieldFull, className)}>
      <label htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label>
      {children}
      {descriptionId ? (
        <small id={descriptionId} className={error ? styles.fieldError : undefined}>
          {error ?? hint}
        </small>
      ) : null}
    </div>
  );
}

export function FormSection({
  step,
  title,
  description,
  children,
  compact = false,
  icon: Icon,
  className,
  status,
}: Readonly<{
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
  compact?: boolean;
  icon?: LucideIcon;
  className?: string | undefined;
  status?: React.ReactNode;
}>): React.JSX.Element {
  return (
    <section className={classNames(styles.formSection, compact && styles.formSectionCompact, className)} aria-labelledby={`form-section-${step}`}>
      <header>
        <span className={styles.formSectionIcon} aria-hidden="true">{Icon ? <Icon size={20} /> : step}</span>
        <div className={styles.formSectionHeading}>
          <div>
            <h2 id={`form-section-${step}`}>{title}</h2>
            <span className={styles.formSectionMeta}>
              <span className={styles.formSectionStep}>Paso {step}</span>
              {status ? <span className={styles.formSectionStatus}>{status}</span> : null}
            </span>
          </div>
          <p>{description}</p>
        </div>
      </header>
      <div className={styles.formGrid}>{children}</div>
    </section>
  );
}
