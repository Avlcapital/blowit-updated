import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";

/* ADD VEHICLE TO WISHLIST */
export const addFavourite = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    const user = await User.findById(req.user._id);

    if (user.favourites.includes(vehicleId)) {
      return res.json({ success: true, message: "Already in favourites" });
    }

    user.favourites.push(vehicleId);
    await user.save();

    res.json({ success: true, message: "Added to favourites" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* REMOVE VEHICLE */
export const removeFavourite = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const user = await User.findById(req.user._id);
    user.favourites = user.favourites.filter((id) => id.toString() !== vehicleId);
    await user.save();

    res.json({ success: true, message: "Removed from favourites" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET USER FAVOURITES */
export const getFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("favourites");

    res.json({ success: true, favourites: user.favourites });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
