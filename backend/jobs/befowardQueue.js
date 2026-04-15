import Queue from "bull";
import { syncBeForwardInventory } from "../services/beforwardSyncService.js";

export const beforwardQueue = new Queue("beforward-sync", process.env.REDIS_URL || "redis://127.0.0.1:6379");

// Process: fetch feed and upsert
beforwardQueue.process(async (job) => {
  return syncBeForwardInventory({
    feedUrl: job.data.feedUrl,
    markMissingAsSold: job.data.markMissingAsSold !== false,
  });
});
