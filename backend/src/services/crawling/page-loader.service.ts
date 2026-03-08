import { chromium, type Page } from "playwright";

export type CrawlPreviewResult = {
  requestedUrl: string;
  finalUrl: string;
  title: string;
  h1: string | null;
  html: string;
  visibleText: string;
  discoveredUrls: string[];
};

const normalizeVisibleText = (text: string): string => {
  return text.replace(/\s+/g, " ").trim();
};

const tryDismissCookieBanners = async (page: Page): Promise<void> => {
  const candidates = [
    "button:has-text('Accept')",
    "button:has-text('Accept all')",
    "button:has-text('Aceptar')",
    "button:has-text('Aceptar todo')",
    "button:has-text('Allow all')",
    "[aria-label='Accept']",
  ];

  for (const selector of candidates) {
    const button = page.locator(selector).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 1000 }).catch(() => undefined);
      return;
    }
  }
};

const MAX_DISCOVERED_URLS = 8;

const normalizeDiscoveredUrl = (value: string): string => {
  const parsed = new URL(value);
  parsed.hash = "";
  parsed.search = "";
  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }
  return parsed.toString();
};

const discoverInternalUrls = async (page: Page, baseUrl: string): Promise<string[]> => {
  const base = new URL(baseUrl);
  const links = await page
    .locator("a[href]")
    .evaluateAll((anchors) =>
      anchors
        .map((anchor) => (anchor as HTMLAnchorElement).href)
        .filter(Boolean),
    )
    .catch(() => []);

  const unique = new Set<string>();
  for (const href of links) {
    try {
      const parsed = new URL(href);
      if (parsed.origin !== base.origin) continue;
      const normalized = normalizeDiscoveredUrl(parsed.toString());
      if (normalized === normalizeDiscoveredUrl(base.toString())) continue;
      unique.add(normalized);
      if (unique.size >= MAX_DISCOVERED_URLS) break;
    } catch {
      // ignore invalid href
    }
  }

  return [...unique];
};

export async function loadPagePreview(
  url: string,
): Promise<CrawlPreviewResult> {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage({
      viewport: {
        width: 1440,
        height: 1024,
      },
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    await page.waitForLoadState("networkidle", {
      timeout: 10_000,
    }).catch(() => undefined);

    await tryDismissCookieBanners(page);

    const [title, html, h1, bodyText, discoveredUrls] = await Promise.all([
      page.title(),
      page.content(),
      page.locator("h1").first().textContent().catch(() => null),
      page.locator("body").innerText().catch(() => ""),
      discoverInternalUrls(page, page.url()),
    ]);

    return {
      requestedUrl: url,
      finalUrl: page.url(),
      title,
      h1: h1?.trim() || null,
      html,
      visibleText: normalizeVisibleText(bodyText),
      discoveredUrls,
    };
  } finally {
    await browser.close();
  }
}
