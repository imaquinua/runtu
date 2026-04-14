import type { NormalizedMention, ScrapingPlatform } from "./types";

// Helpers
function toNumber(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string") { const n = parseFloat(v); return isNaN(n) ? undefined : n; }
  return undefined;
}

function toISO(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

/**
 * Normaliza un item crudo de Apify según la plataforma.
 * Cada actor tiene un shape distinto.
 * Devuelve null si el item no tiene ID externo o texto (no útil para análisis).
 */
export function normalize(platform: ScrapingPlatform, raw: Record<string, unknown>): NormalizedMention | null {
  switch (platform) {
    case "instagram": {
      const id = asString(raw.id) ?? asString(raw.shortCode) ?? asString(raw.pk);
      const text = asString(raw.caption) ?? asString(raw.text) ?? "";
      if (!id || !text) return null;
      return {
        external_id: `ig:${id}`,
        author: asString((raw.ownerUsername as string) ?? (raw.ownerFullName as string)),
        text,
        url: asString(raw.url) ?? `https://instagram.com/p/${raw.shortCode}`,
        engagement: {
          likes: toNumber(raw.likesCount),
          comments: toNumber(raw.commentsCount),
          views: toNumber(raw.videoPlayCount),
        },
        posted_at: toISO(raw.timestamp ?? raw.taken_at_timestamp),
        raw,
      };
    }

    case "tiktok": {
      const id = asString(raw.id) ?? asString(raw.videoId);
      const text = asString((raw.text as string) ?? (raw.desc as string)) ?? "";
      if (!id || !text) return null;
      const authorMeta = raw.authorMeta as Record<string, unknown> | undefined;
      return {
        external_id: `tt:${id}`,
        author: asString(authorMeta?.name ?? authorMeta?.nickName ?? raw.authorName),
        text,
        url: asString(raw.webVideoUrl) ?? "",
        engagement: {
          likes: toNumber(raw.diggCount ?? raw.likes),
          comments: toNumber(raw.commentCount ?? raw.comments),
          shares: toNumber(raw.shareCount ?? raw.shares),
          views: toNumber(raw.playCount ?? raw.views),
        },
        posted_at: toISO(raw.createTimeISO ?? raw.createTime),
        raw,
      };
    }

    case "x": {
      const id = asString(raw.id) ?? asString(raw.tweetId);
      const text = asString((raw.text as string) ?? (raw.full_text as string)) ?? "";
      if (!id || !text) return null;
      const author = raw.author as Record<string, unknown> | undefined;
      return {
        external_id: `x:${id}`,
        author: asString(author?.userName ?? author?.name ?? raw.userName),
        text,
        url: asString(raw.url ?? raw.twitterUrl) ?? `https://x.com/i/status/${id}`,
        engagement: {
          likes: toNumber(raw.likeCount ?? raw.favoriteCount),
          comments: toNumber(raw.replyCount),
          shares: toNumber(raw.retweetCount),
          views: toNumber(raw.viewCount),
        },
        posted_at: toISO(raw.createdAt),
        raw,
      };
    }

    case "reddit": {
      const id = asString(raw.id) ?? asString(raw.postId);
      const text = asString((raw.title as string) ?? "") + "\n" + asString((raw.body as string) ?? (raw.text as string) ?? "");
      if (!id || !text.trim()) return null;
      return {
        external_id: `rd:${id}`,
        author: asString(raw.username ?? raw.author),
        text: text.trim(),
        url: asString(raw.url) ?? "",
        engagement: {
          likes: toNumber(raw.upVotes ?? raw.score),
          comments: toNumber(raw.numberOfComments ?? raw.numComments),
        },
        posted_at: toISO(raw.createdAt ?? raw.created),
        raw,
      };
    }

    case "google-serp": {
      const results = raw.organicResults as Array<Record<string, unknown>> | undefined;
      // Para google-serp devolvemos null porque cada item es un container con múltiples results.
      // El orchestrator debe expandir esto antes de llamar normalize. Manejamos el caso single aquí.
      const id = asString(raw.url) ?? asString(raw.link);
      const text = asString(raw.title) ?? asString(raw.description) ?? "";
      if (!id || !text || results) return null;
      return {
        external_id: `gg:${Buffer.from(id).toString("base64").slice(0, 40)}`,
        author: asString(raw.displayedUrl ?? raw.source),
        text,
        url: id,
        engagement: {},
        posted_at: null,
        raw,
      };
    }
  }

  return null;
}

/**
 * Filtra duplicados por (platform, external_id).
 */
export function dedupe(items: Array<NormalizedMention & { platform: ScrapingPlatform }>): typeof items {
  const seen = new Set<string>();
  const result: typeof items = [];
  for (const item of items) {
    const key = `${item.platform}:${item.external_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
