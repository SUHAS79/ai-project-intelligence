import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const variantClasses = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-sm",
      secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200",
      ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent",
      danger: "bg-red-600 text-white hover:bg-red-700 border-transparent shadow-sm",
      outline: "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
      md: "px-4 py-2 text-sm rounded-lg gap-2",
      lg: "px-5 py-2.5 text-sm rounded-xl gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
