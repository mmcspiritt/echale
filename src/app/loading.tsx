export default function LoadingHome() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8 md:px-8">
      <div className="h-72 rounded-[36px] bg-zinc-100" />
      <div className="mt-6 h-20 rounded-3xl bg-zinc-100" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-[420px] rounded-3xl bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}
