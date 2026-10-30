export function NotificationBellFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="ml-auto h-10 w-10 shrink-0 rounded-xl border border-border bg-white md:ml-0 md:h-11 md:w-11"
    >
      <span className="sr-only">Memuat notifikasi...</span>
    </div>
  );
}
