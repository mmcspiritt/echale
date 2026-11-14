export default function LoadingStory() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-6 md:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="h-[380px] rounded-3xl bg-zinc-100 md:h-[500px]" />
          <div className="h-48 rounded-3xl bg-zinc-100" />
          <div className="h-60 rounded-3xl bg-zinc-100" />
          <div className="h-64 rounded-3xl bg-zinc-100" />
        </div>
        <div className="space-y-4">
          <div className="h-72 rounded-3xl bg-zinc-100" />
          <div className="h-56 rounded-3xl bg-zinc-100" />
          <div className="h-36 rounded-3xl bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
