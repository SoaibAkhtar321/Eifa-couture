'use client';

/* ============================================
   EIFA COUTURE — Google Auth Button
   ============================================
   Extracted from the original login page markup so Login and Register
   share the exact same button (same classes, same icon) instead of
   duplicating it. Visual output is unchanged from what already
   existed on /login.
   ============================================ */

interface GoogleAuthButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  label?: string;
}

export default function GoogleAuthButton({
  onClick,
  isLoading = false,
  label = 'Continue with Google',
}: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center justify-center gap-3 w-full border border-beige bg-ivory px-4 py-3 font-body text-[11px] uppercase tracking-[0.15em] text-charcoal hover:border-maroon hover:bg-cream/40 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.842 1.05 15.105 0 12 0 7.34 0 3.32 2.67 1.34 6.554l3.926 3.211z"
        />
        <path
          fill="#4285F4"
          d="M23.49 12.275c0-.825-.075-1.62-.21-2.385H12v4.515h6.45c-.27 1.455-1.1 2.685-2.325 3.51l3.615 2.805c2.115-1.95 3.345-4.83 3.345-8.445z"
        />
        <path
          fill="#FBBC05"
          d="M5.266 14.235A7.147 7.147 0 0 1 4.91 12c0-.795.135-1.56.356-2.265L1.34 6.525A11.948 11.948 0 0 0 0 12c0 2.01.5 3.915 1.38 5.61l3.886-3.375z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.97-1.08 7.965-2.91l-3.615-2.805c-1.005.675-2.295 1.08-4.35 1.08-4.14 0-7.644-2.805-8.9-6.585L1.205 16.14C3.185 21.315 7.16 24 12 24z"
        />
      </svg>
      {isLoading ? 'Redirecting…' : label}
    </button>
  );
}