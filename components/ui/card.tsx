import type { ReactNode } from "react";
import * as React from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-2xl border border-border bg-card text-card-foreground shadow-sm ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

type CardSectionProps = {
  children: ReactNode;
  className?: string;
};

const CardHeader = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 p-6 border-b border-border/50 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, CardSectionProps>(
  ({ children, className, ...props }, ref) => (
    <h3
      ref={ref}
      className={`font-semibold leading-none tracking-tight text-lg text-foreground font-display ${className || ""}`}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 mt-6 ${className || ""}`} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={`border-t border-border/50 p-6 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
