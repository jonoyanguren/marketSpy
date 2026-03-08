export function buildChangeAnalysisPrompts(input: {
  competitorName: string;
  competitorDomain: string;
  requestedUrl: string;
  oldSnapshot: {
    title: string;
    h1: string | null;
    visibleText: string;
    htmlLength: number;
    visibleTextLength: number;
  };
  newSnapshot: {
    title: string;
    h1: string | null;
    visibleText: string;
    htmlLength: number;
    visibleTextLength: number;
  };
  changeSignals: {
    htmlChanged: boolean;
    visibleTextChanged: boolean;
    titleDiff: { from: string; to: string } | null;
    h1Diff: { from: string | null; to: string | null } | null;
    visibleTextDiff: { added: string[]; removed: string[] } | null;
  };
}): { systemPrompt: string; userPrompt: string } {
  const truncate = (value: string, max: number): string =>
    value.length > max ? `${value.slice(0, max)}...` : value;

  const context = {
    competitor: {
      name: input.competitorName,
      domain: input.competitorDomain,
      requestedUrl: input.requestedUrl,
    },
    oldSnapshot: {
      title: input.oldSnapshot.title,
      h1: input.oldSnapshot.h1,
      htmlLength: input.oldSnapshot.htmlLength,
      visibleTextLength: input.oldSnapshot.visibleTextLength,
      visibleTextExcerpt: truncate(input.oldSnapshot.visibleText, 1200),
    },
    newSnapshot: {
      title: input.newSnapshot.title,
      h1: input.newSnapshot.h1,
      htmlLength: input.newSnapshot.htmlLength,
      visibleTextLength: input.newSnapshot.visibleTextLength,
      visibleTextExcerpt: truncate(input.newSnapshot.visibleText, 1200),
    },
    diffSignals: input.changeSignals,
  };

  return {
    systemPrompt:
      "Eres analista senior de producto y SEO. Debes devolver SOLO JSON valido con conclusiones accionables, sin inventar datos no soportados.",
    userPrompt: [
      "Analiza cambios entre dos snapshots web.",
      "Objetivo: explicar impacto de negocio, severidad y acciones recomendadas.",
      "Devuelve espanol y JSON con el esquema requerido.",
      JSON.stringify(context),
    ].join("\n"),
  };
}

export function buildBaselineReportPrompts(input: {
  competitor: { name: string; domain: string };
  snapshot: {
    crawledAt: string;
    requestedUrl: string;
    finalUrl: string;
    title: string;
    h1: string | null;
    htmlLength: number;
    visibleTextLength: number;
    visibleTextExcerpt: string;
    htmlExcerpt: string;
  };
  fallback: unknown;
}): { systemPrompt: string; userPrompt: string } {
  const context = {
    competitor: input.competitor,
    snapshot: input.snapshot,
    fallback: input.fallback,
  };

  return {
    systemPrompt:
      "Eres analista de inteligencia competitiva. Devuelve SOLO JSON valido y fiel al contexto, sin inventar.",
    userPrompt: [
      "Genera un reporte estructurado de competencia en espanol.",
      "Usa exactamente el contrato JSON requerido.",
      JSON.stringify(context),
    ].join("\n"),
  };
}
