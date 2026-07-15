export default function Loading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="h-8 w-64 animate-pulse rounded-md bg-zinc-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-40 animate-pulse rounded-lg border border-line bg-white" />
        ))}
      </div>
    </section>
  );
}
