import styles from './ui.module.css';
import { classNames } from './class-names.js';

export function Stack({
  children,
  gap = '4',
  className,
}: Readonly<{
  children: React.ReactNode;
  gap?: '2' | '3' | '4' | '6' | '8';
  className?: string;
}>): React.JSX.Element {
  return <div className={classNames(styles.stack, styles[`gap${gap}`], className)}>{children}</div>;
}

export function Inline({
  children,
  gap = '2',
  className,
}: Readonly<{
  children: React.ReactNode;
  gap?: '1' | '2' | '3' | '4';
  className?: string;
}>): React.JSX.Element {
  return <div className={classNames(styles.inline, styles[`gap${gap}`], className)}>{children}</div>;
}

export function Text({
  as: Element = 'p',
  children,
  tone = 'default',
  size = 'md',
  className,
}: Readonly<{
  as?: 'p' | 'span' | 'small' | 'strong';
  children: React.ReactNode;
  tone?: 'default' | 'muted' | 'subtle' | 'inverse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}>): React.JSX.Element {
  return <Element className={classNames(styles.text, styles[tone], styles[size], className)}>{children}</Element>;
}

export function VisuallyHidden({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <span className="srt-visually-hidden">{children}</span>;
}
