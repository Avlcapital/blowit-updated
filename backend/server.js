import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import { initSocket } from "./socket.js";
import http from "http";

import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";


dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors({origin: "*"}));
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/wishlist", wishlistRoutes);


// Default
app.get("/", (req, res) => res.send("Blowit API is running..."));


const server = http.createServer(app);

//initialize Socket.IO
initSocket(server);

// Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
