/** Extrae meta description y headings del HTML */
function parseHtml(html: string): {
  metaDescription: string | null;
  ogDescription: string | null;
  h2: string[];
  h3: string[];
} {
  const metaDesc = html.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i,
  );
  const ogDesc = html.match(
    /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i,
  );
  const h2Matches = html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);
  const h3Matches = html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi);

  const stripTags = (s: string) =>
    s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

  return {
    metaDescription: metaDesc ? stripTags(metaDesc[1]).slice(0, 500) : null,
    ogDescription: ogDesc ? stripTags(ogDesc[1]).slice(0, 500) : null,
    h2: [...h2Matches].map((m) => stripTags(m[1]).slice(0, 200)),
    h3: [...h3Matches].map((m) => stripTags(m[1]).slice(0, 200)),
  };
}

/** Cuenta palabras en texto visible */
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Extrae frases clave (palabras frecuentes, sin stopwords cortos) */
function extractKeyPhrases(text: string, limit = 8): string[] {
  const stopwords = new Set(
    "de la el en y a los del se las un por con no una su para al lo como mas pero sus le ya o fue este ha si porque esta entre cuando muy sin sobre tambien me hasta donde quien desde todo nosotros durante estados ellos mismo ahora bien donde mismo manera otros estos esos tuyo mucho aquel sera fueron cada sera ellos".split(
      " ",
    ),
  );
  const words = text
    .toLowerCase()
    .replace(/[^\wáéíóúñü\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopwords.has(w));
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

export type CompetitorReport = {
  competitor: { name: string; domain: string };
  crawledAt: string;
  url: string;
  snapshotId: string;

  executive: {
    headline: string;
    summary: string;
  };

  positioning: {
    valueProposition: string;
    title: string;
    h1: string | null;
  };

  seo: {
    title: string;
    titleLength: number;
    titleAssessment: "corto" | "ok" | "largo";
    metaDescription: string | null;
    metaDescriptionLength: number;
    metaAssessment: "ausente" | "corto" | "ok" | "largo";
    h1: string | null;
    wordCount: number;
    contentLength: number;
  };

  structure: {
    htmlSize: number;
    headings: { h2: string[]; h3: string[] };
  };

  content: {
    preview: string;
    keyPhrases: string[];
  };
};

type SnapshotDoc = {
  _id: unknown;
  requestedUrl: string;
  finalUrl: string;
  title: string;
  h1: string | null;
  html: string;
  visibleText: string;
  htmlLength: number;
  visibleTextLength: number;
  crawledAt: Date;
};

export function buildCompetitorReport(
  competitor: { name: string; domain: string },
  snapshot: SnapshotDoc,
): CompetitorReport {
  const { metaDescription, ogDescription, h2, h3 } = parseHtml(snapshot.html);
  const desc = metaDescription ?? ogDescription ?? null;
  const descLen = desc?.length ?? 0;

  const titleLen = snapshot.title.length;
  const titleAssessment: "corto" | "ok" | "largo" =
    titleLen < 30 ? "corto" : titleLen > 60 ? "largo" : "ok";

  const metaAssessment: "ausente" | "corto" | "ok" | "largo" = !desc
    ? "ausente"
    : descLen < 70
      ? "corto"
      : descLen > 160
        ? "largo"
        : "ok";

  const valueProposition = [snapshot.title, snapshot.h1]
    .filter(Boolean)
    .join(" · ");

  const preview = snapshot.visibleText
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
  const keyPhrases = extractKeyPhrases(snapshot.visibleText, 8);
  const words = wordCount(snapshot.visibleText);

  const summaryParts: string[] = [];
  summaryParts.push(
    `${competitor.name} se posiciona como "${valueProposition.slice(0, 80)}${valueProposition.length > 80 ? "…" : ""}".`,
  );
  summaryParts.push(
    `Página con ${words} palabras, título de ${titleLen} caracteres${titleAssessment !== "ok" ? ` (${titleAssessment})` : ""}${desc ? `, meta de ${descLen} caracteres` : ", sin meta description"}.`,
  );
  if (h2.length > 0) {
    summaryParts.push(
      `Estructura: ${h2.length} H2, ${h3.length} H3. Palabras clave: ${keyPhrases.slice(0, 4).join(", ")}.`,
    );
  }

  return {
    competitor: { name: competitor.name, domain: competitor.domain },
    crawledAt: snapshot.crawledAt.toISOString(),
    url: snapshot.finalUrl,
    snapshotId: String(snapshot._id).slice(-8),

    executive: {
      headline: `Informe de competencia: ${competitor.name}`,
      summary: summaryParts.join(" "),
    },

    positioning: {
      valueProposition,
      title: snapshot.title,
      h1: snapshot.h1 ?? null,
    },

    seo: {
      title: snapshot.title,
      titleLength: titleLen,
      titleAssessment,
      metaDescription: desc,
      metaDescriptionLength: descLen,
      metaAssessment,
      h1: snapshot.h1 ?? null,
      wordCount: words,
      contentLength: snapshot.visibleTextLength,
    },

    structure: {
      htmlSize: snapshot.htmlLength,
      headings: { h2, h3 },
    },

    content: {
      preview: preview + (snapshot.visibleText.length > 400 ? "…" : ""),
      keyPhrases,
    },
  };
}
