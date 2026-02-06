import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
      {label ? <span>{label}</span> : null}
      <input
        className={`rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-[0_18px_35px_rgba(2,6,23,0.4)] focus:border-teal-400 focus:outline-none ${className ?? ""}`}
        {...props}
      />
    </label>
  );
}
