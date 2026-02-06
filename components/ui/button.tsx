import { cloneElement, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
  asChild?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-teal-400 text-slate-950 shadow-[0_18px_40px_rgba(45,212,191,0.25)] hover:bg-teal-300 focus-visible:outline-teal-300",
  secondary:
    "border border-slate-700/80 bg-slate-900/60 text-slate-200 hover:border-slate-500 hover:bg-slate-800",
  ghost: "text-slate-300 hover:bg-slate-900/70",
};

export default function Button({
  variant = "primary",
  className,
  children,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const styles = `inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${variantStyles[variant]} ${className ?? ""}`;

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: `${styles} ${child.props.className ?? ""}`,
    });
  }

  return (
    <button
      className={styles}
      type={type ?? "button"}
      {...props}
    >
      {children}
    </button>
  );
}
