import Vehicle from "../models/Vehicle.js";
import cloudinary from "../config/cloudinary.js";

// Get all vehicles
export const getVehicles = async (req, res) => {
  try {
    const { make, model, year, category } = req.query;
    const query = {};
    if (make) query.make = make;
    if (model) query.model = model;
    if (year) query.year = year;
    if (category) query.category = category;

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single vehicle
export const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin upload new vehicle (manual or Be Forward sync)
export const addVehicle = async (req, res) => {
  try {
    const imageUrls = req.files.map((f) => f.path);

    const vehicle = new Vehicle({
      title: req.body.title,
      make: req.body.make,
      model: req.body.model,
      year: req.body.year,
      mileage: req.body.mileage,
      engine: req.body.engine,
      fuel: req.body.fuel,
      transmission: req.body.transmission,
      priceFOB: req.body.priceFOB,
      priceCIF: req.body.priceCIF,
      location: req.body.location,
      category: req.body.category,
      images: imageUrls,
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
