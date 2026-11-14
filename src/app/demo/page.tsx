import { DemoView } from "@/components/demo/demo-view";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { getPublicBaseUrl } from "@/lib/site-url";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#fcfcfd]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
        <DemoView baseUrl={getPublicBaseUrl()} />
      </main>
      <SiteFooter />
    </div>
  );
}
