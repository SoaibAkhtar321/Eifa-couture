import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white p-8 border border-beige shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-charcoal mb-3">Welcome Back</h1>
          <p className="font-body text-sm text-charcoal/60">
            Sign in to access your wishlist and track orders.
          </p>
        </div>

        {/* ── Social Login ── */}
        <div className="mb-6">
          <button
            type="button"
            className="flex items-center justify-center gap-3 w-full border border-beige bg-ivory px-4 py-3 font-body text-[11px] uppercase tracking-[0.15em] text-charcoal hover:border-maroon hover:bg-cream/40 transition-all duration-300 cursor-pointer"
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              aria-hidden="true"
            >
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
            Continue with Google
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="relative flex py-4 items-center mb-4">
          <div className="flex-grow border-t border-beige"></div>
          <span className="flex-shrink mx-4 font-body text-[10px] uppercase tracking-[0.2em] text-charcoal/35">
            Or Use Email
          </span>
          <div className="flex-grow border-t border-beige"></div>
        </div>

        {/* ── Email Credentials Form ── */}
        <form className="space-y-5">
          <div>
            <label 
              htmlFor="email" 
              className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/60 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              className="w-full border border-beige bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/30"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label 
                htmlFor="password" 
                className="block font-body text-[10px] uppercase tracking-[0.15em] text-charcoal/60"
              >
                Password
              </label>
              <Link 
                href="#" 
                className="font-body text-[9px] uppercase tracking-wider text-charcoal/40 hover:text-maroon transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              className="w-full border border-beige bg-ivory px-4 py-3 font-body text-sm text-charcoal outline-none transition-colors focus:border-gold placeholder:text-charcoal/30"
              required
            />
          </div>

          <button
            type="button"
            className="btn-luxury btn-luxury-primary w-full mt-2"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center border-t border-beige pt-6">
          <p className="font-body text-xs text-charcoal/50 mb-4">
            Don&apos;t have an account yet?
          </p>
          <Link
            href="#"
            className="btn-luxury btn-luxury-secondary w-full"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}