export default function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-charcoal/10 bg-ivory p-10">
      <div className="flex items-center gap-3 text-sm text-charcoal/50">
        <span className="h-4 w-4 rounded-full border-2 border-maroon/30 border-t-maroon animate-spin" />
        {message}
      </div>
    </div>
  );
}