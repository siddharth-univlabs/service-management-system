"use client";

import { useId, useState } from "react";

export default function PasswordInput({
  label = "Password",
  name,
  placeholder,
  required,
}: {
  label?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = useId();

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-300" htmlFor={inputId}>
      {label ? <span>{label}</span> : null}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={isVisible ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-2 pr-12 text-sm text-slate-100 shadow-[0_18px_35px_rgba(2,6,23,0.4)] focus:border-teal-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-slate-100"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6 0 10 7 10 7a18.32 18.32 0 0 1-3.17 4.19" />
      <path d="M6.61 6.61A18.32 18.32 0 0 0 2 12s4 7 10 7a10.94 10.94 0 0 0 4.12-.79" />
      <path d="M2 2l20 20" />
    </svg>
  );
}
