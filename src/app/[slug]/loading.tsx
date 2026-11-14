export default function LoadingStory() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-6 md:px-8">
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="h-[560px] rounded-3xl bg-zinc-100" />
        <div className="space-y-4">
          <div className="h-64 rounded-3xl bg-zinc-100" />
          <div className="h-64 rounded-3xl bg-zinc-100" />
          <div className="h-64 rounded-3xl bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
