import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
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
  children,
  tone = 'secondary',
  size = 'default',
  className,
}: Readonly<{
  to: string;
  children: React.ReactNode;
  tone?: ButtonTone;
  size?: ButtonSize;
  className?: string;
}>): React.JSX.Element {
  return <Link to={to} className={buttonClasses(tone, size, className)}>{children}</Link>;
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
}: Readonly<{
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}>): React.JSX.Element {
  const descriptionId = hint || error ? `${id}-description` : undefined;
  return (
    <div className={classNames(styles.field, fullWidth && styles.fieldFull)}>
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
}: Readonly<{
  step: number;
  title: string;
  description: string;
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <section className={styles.formSection} aria-labelledby={`form-section-${step}`}>
      <header>
        <span className={styles.step} aria-hidden="true">{step}</span>
        <h2 id={`form-section-${step}`}>{title}</h2>
        <p>{description}</p>
      </header>
      <div className={styles.formGrid}>{children}</div>
    </section>
  );
}
