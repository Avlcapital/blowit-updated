import fetch from "node-fetch";
import Vehicle from "../models/Vehicle.js";

const COLLECTION_PATHS = [
  "vehicles",
  "cars",
  "items",
  "results",
  "inventory",
  "listings",
  "records",
  "data",
  "data.vehicles",
  "data.cars",
  "data.items",
  "data.results",
  "data.inventory",
  "data.listings",
];

const VALUE_ALIASES = {
  beForwardId: [
    "id",
    "vehicleId",
    "vehicleID",
    "beforwardId",
    "beForwardId",
    "carId",
    "listingId",
    "reference",
    "referenceId",
    "stockId",
  ],
  stockNumber: [
    "stockNumber",
    "stockNo",
    "stock_no",
    "stock",
    "lotNumber",
    "lotNo",
    "inventoryNumber",
  ],
  title: ["title", "name", "vehicleName", "headline"],
  brand: ["brand", "make", "manufacturer"],
  model: ["model", "modelName", "vehicleModel"],
  year: ["year", "manufactureYear", "registrationYear", "modelYear"],
  mileage: ["mileage", "odometer", "odo", "mileageKm", "mileage_km"],
  transmission: ["transmission", "gearbox", "transmissionType"],
  fuelType: ["fuelType", "fuel", "engineType"],
  engineCapacity: [
    "engineCapacity",
    "engine",
    "engineSize",
    "engineCc",
    "displacement",
  ],
  color: ["color", "exteriorColor", "bodyColor", "paintColor"],
  exteriorColor: ["exteriorColor", "bodyColor", "paintColor", "color"],
  interiorColor: ["interiorColor", "cabinColor", "seatColor"],
  condition: ["condition", "vehicleCondition"],
  price: ["price", "salePrice", "amount", "cost", "sellingPrice"],
  sourceCurrency: ["currency", "priceCurrency", "currencyCode"],
  description: ["description", "summary", "remarks", "comment", "comments"],
  status: ["status", "availability", "listingStatus"],
  location: ["location", "country", "port", "yard"],
  driveType: ["driveType", "drivetrain", "drive", "traction"],
  bodyType: ["bodyType", "bodyStyle", "category", "vehicleType"],
  doors: ["doors", "doorCount", "numDoors"],
  wheels: ["wheels", "wheelCount"],
  seats: ["seats", "seatCount", "capacity"],
  interiorType: ["interiorType", "upholstery", "seatMaterial"],
  chassisNumber: ["chassisNumber", "chassisNo", "vin", "frameNumber"],
  engineNumber: ["engineNumber", "engineNo", "motorNumber"],
  exteriorGrade: ["exteriorGrade", "gradeExterior", "bodyGrade"],
  interiorGrade: ["interiorGrade", "gradeInterior", "cabinGrade"],
  videoUrl: ["videoUrl", "video", "youtubeUrl", "walkaroundVideo"],
  model3dUrl: ["model3dUrl", "viewerUrl", "viewer360Url", "tourUrl"],
  auctionSheetUrl: [
    "auctionSheetUrl",
    "auctionSheet",
    "auctionReport",
    "inspectionReport",
  ],
  sourceUrl: ["sourceUrl", "listingUrl", "detailUrl", "url", "href"],
  sourceUpdatedAt: ["updatedAt", "updated_at", "lastModified", "syncedAt"],
};

const FEATURE_RULES = {
  hasAC: {
    aliases: ["hasAC", "airConditioning"],
    keywords: ["air conditioning", "aircon", "a/c"],
  },
  powerWindows: {
    aliases: ["powerWindows", "electricWindows"],
    keywords: ["power window", "power windows", "electric windows"],
  },
  bluetooth: {
    aliases: ["bluetooth"],
    keywords: ["bluetooth", "hands free"],
  },
  navigation: {
    aliases: ["navigation", "gps"],
    keywords: ["navigation", "gps", "navi"],
  },
  reverseCamera: {
    aliases: ["reverseCamera", "rearCamera", "backupCamera"],
    keywords: ["reverse camera", "rear camera", "backup camera"],
  },
  hasScreen: {
    aliases: ["hasScreen", "touchscreen", "screen"],
    keywords: ["touchscreen", "screen", "display audio", "monitor"],
  },
  keylessEntry: {
    aliases: ["keylessEntry", "smartKey"],
    keywords: ["keyless", "smart key", "push start"],
  },
  climateControl: {
    aliases: ["climateControl", "dualClimateControl"],
    keywords: ["climate control", "dual climate"],
  },
  sunroof: {
    aliases: ["sunroof", "moonroof"],
    keywords: ["sunroof", "moonroof"],
  },
  fogLights: {
    aliases: ["fogLights"],
    keywords: ["fog lights", "fog lamps"],
  },
  alloyWheels: {
    aliases: ["alloyWheels"],
    keywords: ["alloy wheels", "alloy rims"],
  },
  airbags: {
    aliases: ["airbags"],
    keywords: ["airbags", "airbag", "srs"],
  },
  abs: {
    aliases: ["abs"],
    keywords: ["abs", "anti lock braking"],
  },
};

const DEFAULT_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

const DEFAULT_STOCKLIST_MAX_PAGES = 3;
const DEFAULT_BEFORWARD_USD_TO_KES_RATE = 130;

const hasValue = (value) =>
  value !== undefined &&
  value !== null &&
  !(typeof value === "string" && value.trim() === "") &&
  !(Array.isArray(value) && value.length === 0);

const getPathValue = (source, path) =>
  path.split(".").reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    return acc[key];
  }, source);

const firstValue = (source, paths = []) => {
  for (const path of paths) {
    const value = getPathValue(source, path);
    if (hasValue(value)) return value;
  }
  return undefined;
};

const normalizeText = (value) => {
  if (!hasValue(value)) return undefined;
  if (typeof value === "string") {
    const normalized = value.replace(/\s+/g, " ").trim();
    return normalized || undefined;
  }
  return String(value);
};

const normalizeKey = (value) => {
  const text = normalizeText(value);
  return text ? text.toUpperCase() : undefined;
};

const normalizeUrl = (value) => {
  const text = normalizeText(value);
  if (!text) return undefined;
  if (text.startsWith("//")) return `https:${text}`;
  return text;
};

const normalizeCurrency = (value) => {
  const text = normalizeText(value)?.toUpperCase();
  if (!text) return undefined;
  if (text === "$" || text.includes("USD") || text.includes("US DOLLAR")) return "USD";
  if (
    text.includes("KES") ||
    text.includes("KSH") ||
    text.includes("KENYAN SHILLING")
  ) {
    return "KES";
  }
  return text;
};

const getUsdToKesRate = () => {
  const configured = Number(process.env.BEFORWARD_USD_TO_KES_RATE);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_BEFORWARD_USD_TO_KES_RATE;
};

const convertBeForwardPriceToKes = (amount, currency = "USD") => {
  if (!Number.isFinite(amount)) return undefined;
  const normalizedCurrency = normalizeCurrency(currency) || "USD";
  if (normalizedCurrency === "KES") return Math.round(amount);
  if (normalizedCurrency === "USD") return Math.round(amount * getUsdToKesRate());
  return Math.round(amount);
};

const parseNumber = (value) => {
  if (!hasValue(value)) return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const cleaned = String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return cleaned ? Number(cleaned[0]) : undefined;
};

const parseInteger = (value) => {
  const number = parseNumber(value);
  return Number.isFinite(number) ? Math.round(number) : undefined;
};

const parseBoolean = (value) => {
  if (!hasValue(value)) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = String(value).trim().toLowerCase();

  if (["true", "yes", "y", "1", "available", "present"].includes(normalized)) {
    return true;
  }

  if (["false", "no", "n", "0", "none", "absent"].includes(normalized)) {
    return false;
  }

  return undefined;
};

const parseDate = (value) => {
  if (!hasValue(value)) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizeTransmission = (value) => {
  const text = normalizeText(value)?.toLowerCase();
  if (!text) return undefined;
  if (/(manual|mt)\b/.test(text)) return "Manual";
  if (/(automatic|auto|at|cvt|dct)\b/.test(text)) return "Automatic";
  return undefined;
};

const normalizeFuelType = (value) => {
  const text = normalizeText(value)?.toLowerCase();
  if (!text) return undefined;
  if (text.includes("diesel")) return "Diesel";
  if (text.includes("hybrid")) return "Hybrid";
  if (text.includes("electric") || /\bev\b/.test(text)) return "Electric";
  if (text.includes("petrol") || text.includes("gasoline") || text.includes("gas")) {
    return "Petrol";
  }
  return undefined;
};

const normalizeCondition = (value) => {
  const text = normalizeText(value)?.toLowerCase();
  if (!text) return undefined;
  if (text.includes("recondition")) return "Reconditioned";
  if (text.includes("new")) return "New";
  if (
    text.includes("used") ||
    text.includes("pre-owned") ||
    text.includes("second hand")
  ) {
    return "Used";
  }
  return undefined;
};

const normalizeStatus = (value) => {
  const text = normalizeText(value)?.toLowerCase();
  if (!text) return undefined;
  if (
    text.includes("sold") ||
    text.includes("unavailable") ||
    text.includes("out of stock")
  ) {
    return "Sold";
  }
  if (
    text.includes("pending") ||
    text.includes("reserved") ||
    text.includes("hold")
  ) {
    return "Pending";
  }
  if (
    text.includes("available") ||
    text.includes("in stock") ||
    text.includes("ready")
  ) {
    return "Available";
  }
  return undefined;
};

const normalizeDriveType = (value) => {
  const text = normalizeText(value)?.toLowerCase();
  if (!text) return undefined;
  if (/\bawd\b/.test(text)) return "AWD";
  if (/\b4wd\b|\b4x4\b|four wheel/.test(text)) return "4WD";
  if (/\b2wd\b|\b2x4\b|\bfwd\b|\brwd\b|two wheel/.test(text)) return "2WD";
  return undefined;
};

const normalizeGrade = (value) => {
  const text = normalizeText(value);
  return text ? text.toUpperCase() : undefined;
};

const normalizeImageEntry = (entry) => {
  if (!hasValue(entry)) return undefined;

  if (typeof entry === "string") {
    const url = normalizeUrl(entry);
    return url ? { url, public_id: "" } : undefined;
  }

  if (typeof entry === "object") {
    const url = normalizeUrl(
      firstValue(entry, [
        "url",
        "src",
        "image",
        "imageUrl",
        "secure_url",
        "href",
        "link",
      ])
    );

    if (!url) return undefined;

    return {
      url,
      public_id: normalizeText(firstValue(entry, ["public_id", "publicId"])) || "",
    };
  }

  return undefined;
};

const uniqueImageEntries = (entries = []) => {
  const seen = new Set();
  const output = [];

  for (const entry of entries) {
    const normalized = normalizeImageEntry(entry);
    if (!normalized || seen.has(normalized.url)) continue;
    seen.add(normalized.url);
    output.push(normalized);
  }

  return output;
};

const collectFeatureTokens = (value, target = []) => {
  if (!hasValue(value)) return target;

  if (Array.isArray(value)) {
    value.forEach((item) => collectFeatureTokens(item, target));
    return target;
  }

  if (typeof value === "object") {
    const namedValue = firstValue(value, ["name", "label", "title", "value"]);
    if (hasValue(namedValue)) {
      collectFeatureTokens(namedValue, target);
      return target;
    }

    Object.entries(value).forEach(([key, nestedValue]) => {
      const boolValue = parseBoolean(nestedValue);
      if (boolValue === true) {
        target.push(key.toLowerCase());
      } else if (typeof nestedValue === "string") {
        collectFeatureTokens(`${key} ${nestedValue}`, target);
      } else {
        collectFeatureTokens(nestedValue, target);
      }
    });
    return target;
  }

  String(value)
    .split(/[\n,;/|]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)
    .forEach((token) => target.push(token));

  return target;
};

const getFeatureTokens = (vehicle) => {
  const tokens = [];
  [
    "features",
    "featureList",
    "options",
    "equipment",
    "equipments",
    "extras",
    "accessories",
    "safetyFeatures",
    "comfortFeatures",
    "interiorFeatures",
    "exteriorFeatures",
    "technologyFeatures",
    "specs",
  ].forEach((path) => collectFeatureTokens(getPathValue(vehicle, path), tokens));
  return tokens;
};

const extractFeature = (vehicle, featureTokens, rule) => {
  const explicit = firstValue(vehicle, rule.aliases || []);
  const parsedExplicit = parseBoolean(explicit);
  if (parsedExplicit !== undefined) return parsedExplicit;

  if (!featureTokens.length) return undefined;
  return rule.keywords.some((keyword) =>
    featureTokens.some((token) => token.includes(keyword))
  )
    ? true
    : undefined;
};

const extractMedia = (vehicle) => {
  const imageSources = [
    firstValue(vehicle, [
      "images",
      "photos",
      "gallery",
      "imageUrls",
      "image_urls",
      "photoUrls",
    ]),
    firstValue(vehicle, ["mainImage", "thumbnail", "primaryImage"]),
  ].filter(hasValue);

  const spinSources = [
    firstValue(vehicle, ["spinImages", "images360", "gallery360", "panoramaImages"]),
  ].filter(hasValue);

  const images = uniqueImageEntries(imageSources.flatMap((entry) => [].concat(entry)));
  const spinImages = uniqueImageEntries(
    spinSources.flatMap((entry) => [].concat(entry))
  );

  return {
    images,
    spinImages,
    auctionSheetUrl: normalizeUrl(firstValue(vehicle, VALUE_ALIASES.auctionSheetUrl)),
    videoUrl: normalizeUrl(firstValue(vehicle, VALUE_ALIASES.videoUrl)),
    model3dUrl: normalizeUrl(firstValue(vehicle, VALUE_ALIASES.model3dUrl)),
  };
};

const findVehicleArray = (payload) => {
  for (const path of COLLECTION_PATHS) {
    const value = getPathValue(payload, path);
    if (Array.isArray(value)) return value;
  }

  const queue = [payload];
  const seen = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current)) {
      if (
        current.length === 0 ||
        current.some((item) => item && typeof item === "object" && !Array.isArray(item))
      ) {
        return current;
      }
      continue;
    }

    Object.values(current).forEach((value) => {
      if (Array.isArray(value) || (value && typeof value === "object")) {
        queue.push(value);
      }
    });
  }

  return [];
};

const decodeHtmlEntities = (value = "") =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );

const stripHtml = (value = "") =>
  normalizeText(
    decodeHtmlEntities(
      value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
    )
  );

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fetchRemoteText = async (
  url,
  accept = "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8"
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        ...DEFAULT_FETCH_HEADERS,
        Accept: accept,
      },
    });

    const rawBody = await response.text();

    if (!response.ok) {
      throw new Error(
        `BeForward feed request failed (${response.status}): ${rawBody.slice(0, 160)}`
      );
    }

    return {
      body: rawBody,
      contentType: response.headers.get("content-type") || "",
      finalUrl: response.url || url,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const extractTableValue = (html, labels = []) => {
  for (const label of labels) {
    const match = html.match(
      new RegExp(
        `<th[^>]*>\\s*${escapeRegex(label)}\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`,
        "i"
      )
    );
    const value = stripHtml(match?.[1]);
    if (value) return value;
  }
  return undefined;
};

const mapBeForwardFeatureState = (html) => {
  const features = {};
  const matches = html.matchAll(
    /<li class="attached_(on|off)"[^>]*>([\s\S]*?)<\/li>/gi
  );

  for (const match of matches) {
    const label = stripHtml(match[2])?.toLowerCase();
    if (!label) continue;
    features[label] = match[1] === "on";
  }

  return features;
};

const parseBeForwardDetailPage = (html, detailUrl) => {
  const features = mapBeForwardFeatureState(html);
  const imageMatches = [
    ...html.matchAll(
      /(?:https?:)?\/\/image-cdn\.beforward\.jp\/[^"' )]+/gi
    ),
  ].map((match) => normalizeUrl(match[0]));

  const versionClass = extractTableValue(html, ["Version/Class"]);

  return {
    sourceUrl: detailUrl,
    fuelType: normalizeFuelType(extractTableValue(html, ["Fuel"])),
    color: extractTableValue(html, ["Color"]),
    bodyType: extractTableValue(html, ["Vehicle Type", "Body Type"]),
    location: extractTableValue(html, ["Location"]),
    seats: parseInteger(extractTableValue(html, ["Seats"])),
    doors: parseInteger(extractTableValue(html, ["Doors"])),
    driveType: normalizeDriveType(extractTableValue(html, ["Drive"])),
    chassisNumber: extractTableValue(html, ["Chassis No.", "Chassis No", "Chassis"]),
    engineNumber: extractTableValue(html, ["Engine No.", "Engine No"]),
    description: versionClass,
    images: uniqueImageEntries(imageMatches.map((url) => ({ url }))),
    powerWindows: features["power window"],
    hasAC: features["a/c"],
    abs: features["abs"],
    airbags: features["airbag"],
    navigation: features["navigation"],
    bluetooth: features["bluetooth"],
    reverseCamera: features["back camera"] ?? features["rear camera"],
    sunroof: features["sunroof"],
    alloyWheels: features["alloy wheels"],
    hasScreen:
      features["tv"] ||
      features["dvd"] ||
      features["navigation"] ||
      features["back camera"],
    interiorType: features["leather seat"] ? "Leather" : undefined,
  };
};

const parseBeForwardStockHtml = (html, currentUrl) => {
  const cards = html.match(/<div class="stocklist-row\b[\s\S]*?<\/table>\s*<\/div>/gi) || [];
  const vehicles = [];

  for (const card of cards) {
    const detailPath =
      card.match(/<a[^>]+class="vehicle-url-link"[^>]+href="([^"]+)"/i)?.[1] ||
      card.match(/<a[^>]+href="([^"]+\/id\/\d+\/?)"/i)?.[1];

    const stockNumber = normalizeKey(
      stripHtml(card.match(/Ref No\.\s*<\/p>\s*([^<]+)/i)?.[1])
    );

    if (!detailPath || !stockNumber) continue;

    const detailUrl = new URL(detailPath, currentUrl).href;
    const pathParts = new URL(detailUrl).pathname.split("/").filter(Boolean);
    const brand = normalizeText(pathParts[0]);
    const model = normalizeText(pathParts[1]);
    const rawPriceText = stripHtml(card.match(/<span class="price">([\s\S]*?)<\/span>/i)?.[1]);
    const sourcePrice = parseInteger(rawPriceText);
    const sourceCurrency =
      normalizeCurrency(rawPriceText?.startsWith("$") ? "USD" : undefined) || "USD";

    const title = stripHtml(card.match(/<p class="make-model">([\s\S]*?)<\/p>/i)?.[1]);
    const imageUrl = normalizeUrl(card.match(/<img[^>]+src="([^"]+)"/i)?.[1]);

    vehicles.push({
      beForwardId: stockNumber,
      stockNumber,
      title,
      brand,
      model,
      year: parseInteger(
        stripHtml(
          card.match(/basic-spec-col[^"]*year[\s\S]*?<p class="val">([\s\S]*?)<\/p>/i)?.[1]
        )
      ),
      mileage: parseInteger(
        stripHtml(
          card.match(/basic-spec-col[^"]*mileage[\s\S]*?<p class="val">([\s\S]*?)<\/p>/i)?.[1]
        )
      ),
      engineCapacity: stripHtml(
        card.match(/basic-spec-col[^"]*engine[\s\S]*?<p class="val">([\s\S]*?)<\/p>/i)?.[1]
      ),
      transmission: normalizeTransmission(
        stripHtml(
          card.match(/basic-spec-col[^"]*trans[\s\S]*?<p class="val">([\s\S]*?)<\/p>/i)?.[1]
        )
      ),
      sourcePrice,
      sourceCurrency,
      price: convertBeForwardPriceToKes(sourcePrice, sourceCurrency),
      location: stripHtml(
        card.match(/basic-spec-col[^"]*location[\s\S]*?<span>([\s\S]*?)<\/span>/i)?.[1]
      ),
      condition: /brand\s*new|brandnew/i.test(title || "") ? "New" : "Used",
      status: "Available",
      sourceUrl: detailUrl,
      images: imageUrl ? [{ url: imageUrl, public_id: "" }] : [],
    });
  }

  const nextPath = html.match(/<link rel="next" href="([^"]+)"/i)?.[1];

  return {
    vehicles,
    nextUrl: nextPath ? new URL(nextPath, currentUrl).href : null,
  };
};

const fetchBeForwardHtmlInventory = async (feedUrl) => {
  const maxPages = Number(process.env.BEFORWARD_MAX_PAGES || DEFAULT_STOCKLIST_MAX_PAGES);
  const fetchDetails = process.env.BEFORWARD_FETCH_DETAILS !== "false";
  const collectedVehicles = [];
  const seenIds = new Set();
  let currentUrl = feedUrl;
  let nextUrl = null;
  let pagesFetched = 0;

  while (currentUrl && pagesFetched < maxPages) {
    const response = await fetchRemoteText(currentUrl);
    const parsed = parseBeForwardStockHtml(response.body, response.finalUrl);
    pagesFetched += 1;

    for (const vehicle of parsed.vehicles) {
      const dedupeKey = vehicle.beForwardId || vehicle.stockNumber;
      if (!dedupeKey || seenIds.has(dedupeKey)) continue;

      let enrichedVehicle = vehicle;
      if (fetchDetails && vehicle.sourceUrl) {
        try {
          const detailResponse = await fetchRemoteText(vehicle.sourceUrl);
          enrichedVehicle = {
            ...vehicle,
            ...parseBeForwardDetailPage(detailResponse.body, detailResponse.finalUrl),
          };
        } catch {
          enrichedVehicle = vehicle;
        }
      }

      seenIds.add(dedupeKey);
      collectedVehicles.push(enrichedVehicle);
    }

    nextUrl = parsed.nextUrl;
    currentUrl = parsed.nextUrl;
  }

  return {
    rawVehicles: collectedVehicles,
    partialSync: Boolean(nextUrl),
  };
};

const loadBeForwardVehicles = async (feedUrl) => {
  const response = await fetchRemoteText(feedUrl);

  try {
    const payload = JSON.parse(response.body);
    const rawVehicles = findVehicleArray(payload);

    if (!Array.isArray(rawVehicles) || rawVehicles.length === 0) {
      throw new Error(
        "BeForward feed did not contain a vehicle array. Expected JSON with vehicles, cars, items, results, inventory, or listings."
      );
    }

    return {
      rawVehicles,
      partialSync: false,
    };
  } catch {
    return fetchBeForwardHtmlInventory(response.finalUrl);
  }
};

const normalizeVehicleFromFeed = (vehicle, syncedAt) => {
  const featureTokens = getFeatureTokens(vehicle);
  const media = extractMedia(vehicle);
  const sourcePrice = parseInteger(firstValue(vehicle, VALUE_ALIASES.price));
  const sourceCurrency = normalizeCurrency(
    firstValue(vehicle, VALUE_ALIASES.sourceCurrency)
  );

  const brand = normalizeText(firstValue(vehicle, VALUE_ALIASES.brand));
  const model = normalizeText(firstValue(vehicle, VALUE_ALIASES.model));
  const year = parseInteger(firstValue(vehicle, VALUE_ALIASES.year));
  const title =
    normalizeText(firstValue(vehicle, VALUE_ALIASES.title)) ||
    [year, brand, model].filter(Boolean).join(" ").trim() ||
    undefined;

  const textBlob = [
    normalizeText(firstValue(vehicle, VALUE_ALIASES.title)),
    normalizeText(firstValue(vehicle, VALUE_ALIASES.description)),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    beForwardId: normalizeKey(firstValue(vehicle, VALUE_ALIASES.beForwardId)),
    stockNumber: normalizeKey(firstValue(vehicle, VALUE_ALIASES.stockNumber)),
    title,
    brand,
    model,
    year,
    mileage: parseInteger(firstValue(vehicle, VALUE_ALIASES.mileage)),
    transmission:
      normalizeTransmission(firstValue(vehicle, VALUE_ALIASES.transmission)) ||
      normalizeTransmission(textBlob),
    fuelType:
      normalizeFuelType(firstValue(vehicle, VALUE_ALIASES.fuelType)) ||
      normalizeFuelType(textBlob),
    engineCapacity: normalizeText(firstValue(vehicle, VALUE_ALIASES.engineCapacity)),
    color: normalizeText(firstValue(vehicle, VALUE_ALIASES.color)),
    exteriorColor: normalizeText(firstValue(vehicle, VALUE_ALIASES.exteriorColor)),
    interiorColor: normalizeText(firstValue(vehicle, VALUE_ALIASES.interiorColor)),
    condition: normalizeCondition(firstValue(vehicle, VALUE_ALIASES.condition)),
    sourcePrice,
    sourceCurrency,
    price:
      sourceCurrency !== undefined
        ? convertBeForwardPriceToKes(sourcePrice, sourceCurrency)
        : sourcePrice,
    description: normalizeText(firstValue(vehicle, VALUE_ALIASES.description)),
    status: normalizeStatus(firstValue(vehicle, VALUE_ALIASES.status)),
    location: normalizeText(firstValue(vehicle, VALUE_ALIASES.location)),
    driveType:
      normalizeDriveType(firstValue(vehicle, VALUE_ALIASES.driveType)) ||
      normalizeDriveType(textBlob),
    bodyType: normalizeText(firstValue(vehicle, VALUE_ALIASES.bodyType)),
    doors: parseInteger(firstValue(vehicle, VALUE_ALIASES.doors)),
    wheels: parseInteger(firstValue(vehicle, VALUE_ALIASES.wheels)),
    seats: parseInteger(firstValue(vehicle, VALUE_ALIASES.seats)),
    interiorType: normalizeText(firstValue(vehicle, VALUE_ALIASES.interiorType)),
    chassisNumber: normalizeText(firstValue(vehicle, VALUE_ALIASES.chassisNumber)),
    engineNumber: normalizeText(firstValue(vehicle, VALUE_ALIASES.engineNumber)),
    exteriorGrade: normalizeGrade(firstValue(vehicle, VALUE_ALIASES.exteriorGrade)),
    interiorGrade: normalizeGrade(firstValue(vehicle, VALUE_ALIASES.interiorGrade)),
    sourceUrl: normalizeUrl(firstValue(vehicle, VALUE_ALIASES.sourceUrl)),
    sourceUpdatedAt: parseDate(firstValue(vehicle, VALUE_ALIASES.sourceUpdatedAt)),
    images: media.images,
    spinImages: media.spinImages,
    auctionSheetUrl: media.auctionSheetUrl,
    videoUrl: media.videoUrl,
    model3dUrl: media.model3dUrl,
    has360: media.spinImages.length > 0 || Boolean(media.model3dUrl),
    lastSyncedAt: syncedAt,
    source: "beforward",
    ...Object.fromEntries(
      Object.entries(FEATURE_RULES).map(([field, rule]) => [
        field,
        extractFeature(vehicle, featureTokens, rule),
      ])
    ),
  };
};

const mergeVehicleData = (existingVehicle, normalizedVehicle, syncedAt) => {
  const merged = {
    source: "beforward",
    lastSyncedAt: syncedAt,
    title: normalizedVehicle.title || existingVehicle?.title,
    brand: normalizedVehicle.brand || existingVehicle?.brand,
    model: normalizedVehicle.model || existingVehicle?.model,
    year: normalizedVehicle.year ?? existingVehicle?.year,
    mileage: normalizedVehicle.mileage ?? existingVehicle?.mileage ?? 0,
    transmission: normalizedVehicle.transmission || existingVehicle?.transmission,
    fuelType: normalizedVehicle.fuelType || existingVehicle?.fuelType,
    condition:
      normalizedVehicle.condition || existingVehicle?.condition || "Used",
    status: normalizedVehicle.status || existingVehicle?.status || "Available",
    location: normalizedVehicle.location || existingVehicle?.location || "Japan",
    driveType: normalizedVehicle.driveType || existingVehicle?.driveType || "2WD",
    price: normalizedVehicle.price ?? existingVehicle?.price,
    images:
      normalizedVehicle.images?.length > 0
        ? normalizedVehicle.images
        : existingVehicle?.images,
    spinImages:
      normalizedVehicle.spinImages?.length > 0
        ? normalizedVehicle.spinImages
        : existingVehicle?.spinImages,
    has360:
      normalizedVehicle.has360 ??
      existingVehicle?.has360 ??
      Boolean(existingVehicle?.spinImages?.length || existingVehicle?.model3dUrl),
  };

  [
    "beForwardId",
    "stockNumber",
    "sourcePrice",
    "sourceCurrency",
    "engineCapacity",
    "color",
    "exteriorColor",
    "interiorColor",
    "description",
    "bodyType",
    "doors",
    "wheels",
    "seats",
    "interiorType",
    "chassisNumber",
    "engineNumber",
    "exteriorGrade",
    "interiorGrade",
    "sourceUrl",
    "sourceUpdatedAt",
    "auctionSheetUrl",
    "videoUrl",
    "model3dUrl",
    "hasAC",
    "powerWindows",
    "bluetooth",
    "navigation",
    "reverseCamera",
    "hasScreen",
    "keylessEntry",
    "climateControl",
    "sunroof",
    "fogLights",
    "alloyWheels",
    "airbags",
    "abs",
  ].forEach((field) => {
    if (normalizedVehicle[field] !== undefined) {
      merged[field] = normalizedVehicle[field];
    } else if (existingVehicle?.[field] !== undefined) {
      merged[field] = existingVehicle[field];
    }
  });

  return merged;
};

const validateMergedVehicle = (vehicle) => {
  if (!vehicle.beForwardId && !vehicle.stockNumber) {
    return "missing BeForward identifier and stock number";
  }

  if (!vehicle.title) return "missing vehicle title";
  if (!vehicle.brand) return "missing vehicle brand";
  if (!vehicle.model) return "missing vehicle model";
  if (!Number.isFinite(vehicle.year)) return "missing vehicle year";
  if (!Number.isFinite(vehicle.price)) return "missing vehicle price";
  if (!vehicle.transmission) return "missing vehicle transmission";
  if (!vehicle.fuelType) return "missing vehicle fuel type";

  return null;
};

const applyVehicleData = (vehicleDocument, mergedVehicle) => {
  Object.entries(mergedVehicle).forEach(([field, value]) => {
    if (value !== undefined) {
      vehicleDocument[field] = value;
    }
  });
};

export const formatBeForwardSyncSummary = (result) =>
  [
    `Sync complete.`,
    `${result.created} created`,
    `${result.updated} updated`,
    `${result.unchanged} unchanged`,
    `${result.markedSold} marked sold`,
    `${result.skipped} skipped`,
    result.partialSync ? "(partial crawl)" : null,
  ]
    .filter(Boolean)
    .join(" ");

export const syncBeForwardInventory = async ({
  feedUrl,
  markMissingAsSold = true,
} = {}) => {
  if (!normalizeText(feedUrl)) {
    throw new Error(
      "BeForward feed URL is missing. Set BEFORWARD_FEED_URL or send feedUrl in the request body."
    );
  }

  const syncedAt = new Date();
  const { rawVehicles, partialSync } = await loadBeForwardVehicles(feedUrl);

  const normalizedByKey = new Map();

  for (const rawVehicle of rawVehicles) {
    const normalizedVehicle = normalizeVehicleFromFeed(rawVehicle, syncedAt);
    const dedupeKey =
      normalizedVehicle.beForwardId ||
      (normalizedVehicle.stockNumber
        ? `stock:${normalizedVehicle.stockNumber}`
        : undefined);

    if (!dedupeKey) continue;
    normalizedByKey.set(dedupeKey, normalizedVehicle);
  }

  const normalizedVehicles = [...normalizedByKey.values()];
  const beForwardIds = normalizedVehicles
    .map((vehicle) => vehicle.beForwardId)
    .filter(Boolean);
  const stockNumbers = normalizedVehicles
    .map((vehicle) => vehicle.stockNumber)
    .filter(Boolean);
  const beForwardIdSet = new Set(beForwardIds);
  const stockNumberSet = new Set(stockNumbers);

  const existingLookupQuery = [];
  if (beForwardIds.length > 0) {
    existingLookupQuery.push({ beForwardId: { $in: beForwardIds } });
  }
  if (stockNumbers.length > 0) {
    existingLookupQuery.push({ stockNumber: { $in: stockNumbers } });
  }

  const existingVehicles =
    existingLookupQuery.length > 0
      ? await Vehicle.find({
          source: "beforward",
          $or: existingLookupQuery,
        })
      : [];

  const existingByBeForwardId = new Map();
  const existingByStockNumber = new Map();

  existingVehicles.forEach((vehicle) => {
    if (vehicle.beForwardId) existingByBeForwardId.set(vehicle.beForwardId, vehicle);
    if (vehicle.stockNumber) existingByStockNumber.set(vehicle.stockNumber, vehicle);
  });

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;
  const skippedItems = [];

  for (const normalizedVehicle of normalizedVehicles) {
    const existingVehicle =
      existingByBeForwardId.get(normalizedVehicle.beForwardId) ||
      existingByStockNumber.get(normalizedVehicle.stockNumber);

    const mergedVehicle = mergeVehicleData(existingVehicle, normalizedVehicle, syncedAt);
    const validationError = validateMergedVehicle(mergedVehicle);

    if (validationError) {
      skipped += 1;
      skippedItems.push({
        identifier:
          normalizedVehicle.beForwardId ||
          normalizedVehicle.stockNumber ||
          normalizedVehicle.title ||
          "unknown",
        reason: validationError,
      });
      continue;
    }

    if (!existingVehicle) {
      const createdVehicle = await Vehicle.create(mergedVehicle);
      if (createdVehicle.beForwardId) {
        existingByBeForwardId.set(createdVehicle.beForwardId, createdVehicle);
      }
      if (createdVehicle.stockNumber) {
        existingByStockNumber.set(createdVehicle.stockNumber, createdVehicle);
      }
      created += 1;
      continue;
    }

    applyVehicleData(existingVehicle, mergedVehicle);

    if (existingVehicle.isModified()) {
      await existingVehicle.save();
      updated += 1;
    } else {
      unchanged += 1;
    }
  }

  let markedSold = 0;

  if (
    markMissingAsSold &&
    !partialSync &&
    (beForwardIds.length > 0 || stockNumbers.length > 0)
  ) {
    const allBeForwardVehicles = await Vehicle.find({ source: "beforward" }).select(
      "_id beForwardId stockNumber status"
    );

    const staleVehicleIds = allBeForwardVehicles
      .filter((vehicle) => {
        const hasIdentifier = Boolean(vehicle.beForwardId || vehicle.stockNumber);
        if (!hasIdentifier) return false;

        const foundByBeForwardId =
          vehicle.beForwardId && beForwardIdSet.has(vehicle.beForwardId);
        const foundByStockNumber =
          vehicle.stockNumber && stockNumberSet.has(vehicle.stockNumber);

        return !foundByBeForwardId && !foundByStockNumber;
      })
      .map((vehicle) => vehicle._id);

    if (staleVehicleIds.length > 0) {
      const staleUpdate = await Vehicle.updateMany(
        { _id: { $in: staleVehicleIds }, status: { $ne: "Sold" } },
        { $set: { status: "Sold", lastSyncedAt: syncedAt } }
      );
      markedSold = staleUpdate.modifiedCount || 0;
    }
  }

  return {
    totalFetched: rawVehicles.length,
    totalNormalized: normalizedVehicles.length,
    created,
    updated,
    unchanged,
    skipped,
    markedSold,
    partialSync,
    syncedAt,
    skippedItems: skippedItems.slice(0, 10),
  };
};
