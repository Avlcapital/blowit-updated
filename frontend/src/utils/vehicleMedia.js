const getMediaUrl = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object" && item.url) return item.url;
  return "";
};

const getFilenameKey = (url) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1]?.split("?")[0]?.toLowerCase() || url;
  } catch {
    const cleanUrl = url.split("?")[0];
    const parts = cleanUrl.split("/").filter(Boolean);
    return parts[parts.length - 1]?.toLowerCase() || cleanUrl.toLowerCase();
  }
};

const optimizeBeForwardImageUrl = (url, preferredSize = "large") => {
  if (!url || !url.includes("image-cdn.beforward.jp")) return url;

  const cleanedUrl = url.replace(/\?w=\d+$/i, "");
  return cleanedUrl.replace(
    /\/(original|large|medium|small)\//i,
    `/${preferredSize}/`
  );
};

const getUrlPriority = (url, preferredSize = "large") => {
  const normalized = url.toLowerCase();
  if (preferredSize === "small") {
    if (normalized.includes("/small/")) return 4;
    if (normalized.includes("/medium/")) return 3;
    if (normalized.includes("/large/")) return 2;
    if (normalized.includes("/original/")) return 1;
    if (normalized.includes("?w=")) return 0;
    return 2;
  }

  if (normalized.includes("/large/")) return 4;
  if (normalized.includes("/medium/")) return 3;
  if (normalized.includes("/small/")) return 2;
  if (normalized.includes("/original/")) return 1;
  if (normalized.includes("?w=")) return 0;
  return 2;
};

export const normalizeVehicleMedia = (items = [], limit, preferredSize = "large") => {
  const keyed = new Map();
  const order = [];

  items.forEach((item) => {
    const url = getMediaUrl(item);
    if (!url) return;

    const key = getFilenameKey(url);
    const optimizedUrl = optimizeBeForwardImageUrl(url, preferredSize);
    const normalizedItem =
      typeof item === "string"
        ? { url: optimizedUrl }
        : { ...item, url: optimizedUrl };

    if (!keyed.has(key)) {
      keyed.set(key, normalizedItem);
      order.push(key);
      return;
    }

    const existing = keyed.get(key);
    if (
      getUrlPriority(url, preferredSize) >
      getUrlPriority(existing.url || "", preferredSize)
    ) {
      keyed.set(key, normalizedItem);
    }
  });

  const normalized = order.map((key) => keyed.get(key)).filter(Boolean);
  return typeof limit === "number" ? normalized.slice(0, limit) : normalized;
};
