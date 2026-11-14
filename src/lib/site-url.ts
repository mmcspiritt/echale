function normalizeBaseUrl(input: string | undefined | null) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function getPublicBaseUrl() {
  const fromPublic = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  const fromVercelProject = normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  return fromPublic ?? fromVercelProject ?? "https://echale.vercel.app";
}

export function getPublicStoryUrl(slug: string) {
  const safeSlug = slug.replace(/^\/+/, "");
  return `${getPublicBaseUrl()}/${safeSlug}`;
}

export function displayDomainFromUrl(input: string) {
  try {
    const url = new URL(input);
    return url.host;
  } catch {
    return input.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}
