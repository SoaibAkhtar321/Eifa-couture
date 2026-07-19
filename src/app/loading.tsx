export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-ivory">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-gold/25" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold" />
        </div>

        <span className="font-body text-[10px] uppercase tracking-[0.32em] text-charcoal/50">
          Eifa Couture
        </span>
      </div>
    </main>
  );
}
