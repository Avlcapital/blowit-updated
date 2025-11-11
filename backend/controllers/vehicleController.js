import Vehicle from "../models/Vehicle.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { Parser as Json2CsvParser } from "json2csv";
import csv from "csv-parser";
import { beforwardQueue } from "../jobs/befowardQueue.js";

/* CREATE */
export const createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    console.error("Error creating vehicle:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* LIST + FILTER + PAGINATE */
export const getVehicles = async (req, res) => {
  try {
    const {
      brand,
      model,
      year,
      status,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      q, // free text on title / model
    } = req.query;

    const query = {};
    if (brand) query.brand = brand;
    if (model) query.model = model;
    if (year) query.year = Number(year);
    if (status) query.status = status;
    if (minPrice || maxPrice) query.price = { $gte: Number(minPrice || 0), $lte: Number(maxPrice || 1e12) };
    if (q) query.$or = [{ title: new RegExp(q, "i") }, { model: new RegExp(q, "i") }];

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Vehicle.countDocuments(query),
    ]);

    res.json({ success: true, vehicles, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET ONE */
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* UPDATE */
export const updateVehicle = async (req, res) => {
  try {
    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, vehicle: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* DELETE */
export const deleteVehicle = async (req, res) => {
  try {
    const v = await Vehicle.findById(req.params.id);
    if (!v) return res.status(404).json({ success: false, message: "Vehicle not found" });

    // optional: cleanup cloudinary images
    for (const img of v.images || []) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }
    await v.deleteOne();
    res.json({ success: true, message: "Vehicle deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* IMAGE: BULK UPLOAD (returns cloudinary list) */
export const uploadVehicleImages = async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ success: false, message: "No files" });
    const uploaded = [];
    for (const file of req.files) {
      const r = await cloudinary.uploader.upload(file.path, { folder: "blowit/vehicles" });
      uploaded.push({ url: r.secure_url, public_id: r.public_id });
      fs.unlinkSync(file.path);
    }
    res.json({ success: true, images: uploaded });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* IMAGE: ADD to existing (merge) */
export const addImagesToVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const v = await Vehicle.findById(id);
    if (!v) return res.status(404).json({ success: false, message: "Vehicle not found" });

    const uploaded = [];
    for (const file of req.files) {
      const r = await cloudinary.uploader.upload(file.path, { folder: "blowit/vehicles" });
      uploaded.push({ url: r.secure_url, public_id: r.public_id });
      fs.unlinkSync(file.path);
    }

    v.images = [...(v.images || []), ...uploaded];
    await v.save();
    res.json({ success: true, images: v.images });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* IMAGE: DELETE single image by public_id */
export const deleteVehicleImage = async (req, res) => {
  try {
    const { id, publicId } = req.params;
    const v = await Vehicle.findById(id);
    if (!v) return res.status(404).json({ success: false, message: "Vehicle not found" });

    // remove from cloudinary
    await cloudinary.uploader.destroy(publicId);

    // remove from array
    v.images = (v.images || []).filter((img) => img.public_id !== publicId);
    await v.save();

    res.json({ success: true, images: v.images });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* EXPORT CSV */
export const exportVehiclesCSV = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}).lean();
    const fields = [
      "title","brand","model","year","mileage","transmission","fuelType","engineCapacity","color","condition",
      "price","status","stockNumber","location","source","beForwardId","createdAt"
    ];
    const parser = new Json2CsvParser({ fields });
    const csvData = parser.parse(vehicles);

    res.header("Content-Type", "text/csv");
    res.attachment("vehicles.csv");
    return res.send(csvData);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* IMPORT CSV (bulk upsert by stockNumber if present) */
export const importVehiclesCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "CSV file required" });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        let created = 0, updated = 0;
        for (const r of results) {
          const payload = {
            title: r.title,
            brand: r.brand,
            model: r.model,
            year: Number(r.year),
            mileage: Number(r.mileage || 0),
            transmission: r.transmission,
            fuelType: r.fuelType,
            engineCapacity: r.engineCapacity,
            color: r.color,
            condition: r.condition || "Used",
            price: Number(r.price || 0),
            status: r.status || "Available",
            stockNumber: r.stockNumber || undefined,
            location: r.location || "Japan",
            source: r.source || "local",
            beForwardId: r.beForwardId || undefined,
          };

          if (payload.stockNumber) {
            const u = await Vehicle.findOneAndUpdate({ stockNumber: payload.stockNumber }, payload, { upsert: true, new: false });
            if (u) updated++; else created++;
          } else {
            await Vehicle.create(payload);
            created++;
          }
        }
        fs.unlinkSync(req.file.path);
        res.json({ success: true, message: "CSV processed", created, updated });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const importFromBeForward = async (req, res) => {
  try {
    await beforwardQueue.add({ feedUrl: process.env.BEFORWARD_FEED_URL }, { attempts: 3, backoff: 60000 });
    res.json({ success: true, message: "Be Forward sync queued." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
