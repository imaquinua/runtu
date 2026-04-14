import type { ScrapingPlatform, ScrapingJobType, ActorInput } from "./types";

const ITEMS_PER_PLATFORM = 50;

/**
 * Mapa plataforma → actor de Apify + builder del input JSON.
 * Cada builder recibe el query + type y devuelve el payload listo para POST /acts/{id}/runs.
 *
 * Facebook y LinkedIn quedan fuera del MVP porque requieren cookies de sesión.
 */
export function getActorForPlatform(
  platform: ScrapingPlatform,
  query: string,
  type: ScrapingJobType
): ActorInput | null {
  const q = query.replace(/^[#@]/, "");

  switch (platform) {
    case "instagram":
      if (type === "hashtag") {
        return {
          actorId: "apify/instagram-hashtag-scraper",
          input: { hashtags: [q], resultsLimit: ITEMS_PER_PLATFORM },
        };
      }
      if (type === "account") {
        return {
          actorId: "apify/instagram-profile-scraper",
          input: { usernames: [q], resultsLimit: ITEMS_PER_PLATFORM },
        };
      }
      return {
        actorId: "apify/instagram-scraper",
        input: { search: q, searchType: "user", resultsLimit: ITEMS_PER_PLATFORM },
      };

    case "tiktok":
      return {
        actorId: "clockworks/tiktok-scraper",
        input: {
          hashtags: type === "hashtag" ? [q] : undefined,
          profiles: type === "account" ? [q] : undefined,
          searchQueries: type === "keyword" ? [q] : undefined,
          resultsPerPage: ITEMS_PER_PLATFORM,
          shouldDownloadVideos: false,
        },
      };

    case "x":
      return {
        actorId: "apidojo/twitter-scraper-lite",
        input: {
          searchTerms: [type === "account" ? `from:${q}` : `${type === "hashtag" ? "#" : ""}${q}`],
          maxTweets: ITEMS_PER_PLATFORM,
          sort: "Latest",
        },
      };

    case "reddit":
      return {
        actorId: "trudax/reddit-scraper",
        input: {
          searches: [q],
          maxItems: ITEMS_PER_PLATFORM,
          sort: "new",
        },
      };

    case "google-serp":
      return {
        actorId: "apify/google-search-scraper",
        input: {
          queries: q,
          resultsPerPage: ITEMS_PER_PLATFORM,
          maxPagesPerQuery: 1,
        },
      };

    default:
      return null;
  }
}

export const SUPPORTED_PLATFORMS: ScrapingPlatform[] = [
  "instagram",
  "tiktok",
  "x",
  "reddit",
  "google-serp",
];
