// backend/controllers/vehicleController.js
import Vehicle from "../models/Vehicle.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import { Parser as Json2CsvParser } from "json2csv";
import csv from "csv-parser";
import { beforwardQueue } from "../jobs/befowardQueue.js";
import {
  formatBeForwardSyncSummary,
  syncBeForwardInventory,
} from "../services/beforwardSyncService.js";

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

/* LIST + FILTER + PAGINATE (ADMIN) */
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
      q,
    } = req.query;

    const query = {};

    if (brand && brand.trim() !== "") query.brand = brand.trim();
    if (model && model.trim() !== "") query.model = model.trim();
    if (year && year.trim() !== "") query.year = Number(year);
    if (status && status.trim() !== "") query.status = status.trim();

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (q && q.trim() !== "") {
      query.$or = [
        { title: new RegExp(q.trim(), "i") },
        { model: new RegExp(q.trim(), "i") },
        { brand: new RegExp(q.trim(), "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Vehicle.countDocuments(query),
    ]);

    res.json({
      success: true,
      vehicles,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET ONE */
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle)
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* UPDATE */
export const updateVehicle = async (req, res) => {
  try {
    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, vehicle: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* DELETE */
export const deleteVehicle = async (req, res) => {
  try {
    const v = await Vehicle.findById(req.params.id);
    if (!v)
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });

    // cleanup images
    for (const img of v.images || []) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }

    // cleanup spin images
    for (const img of v.spinImages || []) {
      if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
    }

    // cleanup auction sheet
    if (v.auctionSheetPublicId) {
      await cloudinary.uploader.destroy(v.auctionSheetPublicId);
    }

    await v.deleteOne();
    res.json({ success: true, message: "Vehicle deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* IMAGE: BULK UPLOAD (main gallery) */
export const uploadVehicleImages = async (req, res) => {
  try {
    if (!req.files?.length)
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });

    const uploaded = [];
    for (const file of req.files) {
      const r = await cloudinary.uploader.upload(file.path, {
        folder: "blowit/vehicles",
      });
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
    if (!v)
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });

    const uploaded = [];
    for (const file of req.files) {
      const r = await cloudinary.uploader.upload(file.path, {
        folder: "blowit/vehicles",
      });
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

/* IMAGE: DELETE single image by public_id (main gallery) */
export const deleteVehicleImage = async (req, res) => {
  try {
    const { id, publicId } = req.params;
    const v = await Vehicle.findById(id);
    if (!v)
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });

    await cloudinary.uploader.destroy(publicId);
    v.images = (v.images || []).filter((img) => img.public_id !== publicId);
    await v.save();

    res.json({ success: true, images: v.images });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* === NEW: UPLOAD AUCTION SHEET (single image/PDF) === */
export const uploadVehicleAuctionSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const v = await Vehicle.findById(id);
    if (!v)
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });

    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    // delete old auction sheet if exists
    if (v.auctionSheetPublicId) {
      await cloudinary.uploader.destroy(v.auctionSheetPublicId);
    }

    const r = await cloudinary.uploader.upload(req.file.path, {
      folder: "blowit/vehicles/auction-sheets",
      resource_type: "auto",
    });
    fs.unlinkSync(req.file.path);

    v.auctionSheetUrl = r.secure_url;
    v.auctionSheetPublicId = r.public_id;
    await v.save();

    res.json({
      success: true,
      auctionSheetUrl: v.auctionSheetUrl,
      auctionSheetPublicId: v.auctionSheetPublicId,
    });
  } catch (err) {
    console.error("Auction sheet upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const removeVehicleAuctionSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const v = await Vehicle.findById(id);
    if (!v)
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });

    if (v.auctionSheetPublicId) {
      await cloudinary.uploader.destroy(v.auctionSheetPublicId);
    }

    v.auctionSheetUrl = undefined;
    v.auctionSheetPublicId = undefined;
    await v.save();

    res.json({ success: true, message: "Auction sheet removed" });
  } catch (err) {
    console.error("Remove auction sheet error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* === NEW: SPIN IMAGES (360°) === */
export const uploadVehicleSpinImages = async (req, res) => {
  try {
    const { id } = req.params;
    const v = await Vehicle.findById(id);
    if (!v)
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });

    if (!req.files?.length)
      return res
        .status(400)
        .json({ success: false, message: "No files uploaded" });

    const uploaded = [];
    for (const file of req.files) {
      const r = await cloudinary.uploader.upload(file.path, {
        folder: "blowit/vehicles/360-spin",
      });
      uploaded.push({ url: r.secure_url, public_id: r.public_id });
      fs.unlinkSync(file.path);
    }

    v.spinImages = [...(v.spinImages || []), ...uploaded];
    await v.save();

    res.json({ success: true, spinImages: v.spinImages });
  } catch (err) {
    console.error("Spin images upload error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteVehicleSpinImage = async (req, res) => {
  try {
    const { id, publicId } = req.params;
    const v = await Vehicle.findById(id);
    if (!v)
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });

    await cloudinary.uploader.destroy(publicId);
    v.spinImages = (v.spinImages || []).filter(
      (img) => img.public_id !== publicId
    );
    await v.save();

    res.json({ success: true, spinImages: v.spinImages });
  } catch (err) {
    console.error("Delete spin image error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* EXPORT CSV */
export const exportVehiclesCSV = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}).lean();
    const fields = [
      "title",
      "brand",
      "model",
      "year",
      "mileage",
      "transmission",
      "fuelType",
      "engineCapacity",
      "color",
      "condition",
      "price",
      "status",
      "stockNumber",
      "location",
      "source",
      "beForwardId",
      "createdAt",
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

/* IMPORT CSV (bulk upsert with images) */
export const importVehiclesCSV = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({
        success: false,
        message: "CSV file required",
      });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", async () => {
        let created = 0;
        let updated = 0;

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

            // FIXED IMAGE KEYS
            images: [
              r.image1 && { url: r.image1 },
              r.image2 && { url: r.image2 },
              r.image3 && { url: r.image3 },
              r.image4 && { url: r.image4 },
              r.image5 && { url: r.image5 },
            ].filter(Boolean),

            // FIXED SPIN IMAGE KEY
            spinImages: [
              r.spinImage && { url: r.spinImage },
            ].filter(Boolean),

            // Auction sheet
            auctionSheetUrl: r.auctionSheetUrl || undefined,
          };

          // UPSERT USING stockNumber
          if (payload.stockNumber) {
            const u = await Vehicle.findOneAndUpdate(
              { stockNumber: payload.stockNumber },
              payload,
              { upsert: true, new: false }
            );
            if (u) updated++;
            else created++;
          } else {
            await Vehicle.create(payload);
            created++;
          }
        }

        fs.unlinkSync(req.file.path);

        res.json({
          success: true,
          message: "CSV processed",
          created,
          updated,
        });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};




export const importFromBeForward = async (req, res) => {
  try {
    const feedUrl = req.body?.feedUrl || process.env.BEFORWARD_FEED_URL;
    const requestedMode =
      req.query.mode || req.body?.mode || process.env.BEFORWARD_SYNC_MODE || "direct";
    const markMissingAsSold =
      req.body?.markMissingAsSold !== false && req.query.markMissingAsSold !== "false";

    if (!feedUrl) {
      return res.status(400).json({
        success: false,
        message:
          "BeForward feed URL is missing. Set BEFORWARD_FEED_URL or include feedUrl in the request body.",
      });
    }

    if (requestedMode === "queue") {
      const job = await beforwardQueue.add(
        { feedUrl, markMissingAsSold },
        { attempts: 3, backoff: 60000, removeOnComplete: 20, removeOnFail: 20 }
      );

      return res.json({
        success: true,
        queued: true,
        jobId: job.id,
        message: "BeForward sync queued.",
      });
    }

    const result = await syncBeForwardInventory({ feedUrl, markMissingAsSold });
    res.json({
      success: true,
      result,
      message: formatBeForwardSyncSummary(result),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET ONE (PUBLIC) */
export const getPublicVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      status: "Available",
    });

    if (!vehicle) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found" });
    }

    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* PUBLIC LIST (used by Landing page + PublicVehicles) */
export const getPublicVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      q = "",
      brand = "",
      model = "",
      minYear = "",
      maxYear = "",
      minPrice = "",
      maxPrice = "",
      transmission = "",
      fuelType = "",
      sort = "latest",
    } = req.query;

    const filter = {};

    // Only show "Available" to public
    filter.status = "Available";

    if (q.trim() !== "") {
      filter.$or = [
        { title: { $regex: q.trim(), $options: "i" } },
        { model: { $regex: q.trim(), $options: "i" } },
        { brand: { $regex: q.trim(), $options: "i" } },
      ];
    }

    if (brand.trim() !== "") filter.brand = brand.trim();
    if (model.trim() !== "") filter.model = model.trim();
    if (transmission.trim() !== "")
      filter.transmission = transmission.trim();
    if (fuelType.trim() !== "") filter.fuelType = fuelType.trim();

    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = Number(minYear);
      if (maxYear) filter.year.$lte = Number(maxYear);
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortMap = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
      mileage_low: { mileage: 1 },
      mileage_high: { mileage: -1 },
    };
    const sorting = sortMap[sort] || sortMap.latest;

    const total = await Vehicle.countDocuments(filter);

    const vehicles = await Vehicle.find(filter)
      .sort(sorting)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      vehicles,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total,
    });
  } catch (err) {
    console.error("PUBLIC VEHICLES ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
