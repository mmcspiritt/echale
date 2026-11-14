import { DemoView } from "@/components/demo/demo-view";
import { getPublicBaseUrl } from "@/lib/site-url";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <DemoView baseUrl={getPublicBaseUrl()} />
      </main>
    </div>
  );
}
