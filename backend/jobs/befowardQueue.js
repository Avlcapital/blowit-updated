import Queue from "bull";
import fetch from "node-fetch";
import Vehicle from "../models/Vehicle.js";

export const beforwardQueue = new Queue("beforward-sync", process.env.REDIS_URL || "redis://127.0.0.1:6379");

// Process: fetch feed and upsert
beforwardQueue.process(async (job) => {
  const { feedUrl } = job.data;
  const res = await fetch(feedUrl, { timeout: 30000 });
  const data = await res.json(); // expect array of cars

  let created = 0, updated = 0;
  for (const car of data) {
    const payload = {
      title: car.title,
      brand: car.brand,
      model: car.model,
      year: car.year,
      mileage: car.mileage,
      transmission: car.transmission,
      fuelType: car.fuelType,
      engineCapacity: car.engineCapacity,
      color: car.color,
      condition: car.condition || "Used",
      price: car.price,
      status: car.status || "Available",
      stockNumber: car.stockNumber,
      location: car.location || "Japan",
      source: "beforward",
      beForwardId: car.id,
      images: (car.images || []).map((u) => ({ url: u, public_id: "" })), // (optional) store URLs only
    };

    if (payload.stockNumber) {
      const u = await Vehicle.findOneAndUpdate({ stockNumber: payload.stockNumber }, payload, { upsert: true, new: false });
      if (u) updated++; else created++;
    } else {
      await Vehicle.create(payload);
      created++;
    }
  }
  return { created, updated };
});
