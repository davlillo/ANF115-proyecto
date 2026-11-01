export default function LoadingPrivado() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando contenido</span>
      <div className="space-y-3">
        <div className="h-3 w-40 animate-pulse rounded-pill bg-superficie-tenue" />
        <div className="h-9 w-72 animate-pulse rounded-input bg-superficie-tenue" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded-pill bg-superficie-tenue" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-card border border-borde bg-superficie"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card border border-borde bg-superficie" />
    </div>
  );
}
