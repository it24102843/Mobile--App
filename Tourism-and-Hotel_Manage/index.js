import express from "express"
import bodyParser from "body-parser";
import mongoose from "mongoose";
import path from "node:path";
import userRouter from "./routes/userRouter.js";
import jwt from "jsonwebtoken" ;
import dotenv from "dotenv";
import reviewRouter from "./routes/reviewRouter.js";
import productRouter from "./routes/ProductRouter.js";
import inquiryRouter from "./routes/inquiryRouter.js";
import cors from "cors";
import orderRouter from "./routes/orderRouter.js";
import dns from 'node:dns';
import packageRouter from "./routes/packageRouter.js";
import packageBookingRouter from "./routes/packageBookingRouter.js";
import packageVehicleRouter from "./routes/packageVehicleRouter.js";
import bookingRouter from "./routes/bookingRouter.js";
import addonRouter from "./routes/addonRouter.js";
import router from "./routes/eventRouter.js";
import OpenAI from "openai";
import vehicleRouter from "./routes/VehicleRouter.js";
import vehicleBookingRouter from "./routes/VehicleBookingRouter.js";
import restaurantRouter from "./routes/RestaurantRouter.js";
import foodOrderRouter from "./routes/foodOrderRouter.js";
import roomRouter from "./routes/Roomrouter.js";
import hotelRouter from "./routes/hotelRouter.js";
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');

dotenv.config();
if (process.env.MONGO_USE_GOOGLE_DNS === "true") {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
}
dns.setDefaultResultOrder('ipv4first');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app=express()
app.use(cors());

app.use(bodyParser.json());
app.use("/uploads", express.static(path.resolve("uploads")));
app.use("/public/uploads", express.static(path.resolve("public", "uploads")));
app.use((req,res,next)=>{

    let token=req.header
    ("Authorization")
    
    if(token != null){
        token = token.replace("Bearer ","")

        jwt.verify(token,process.env.JWT_SECRET,
            (err,decoded)=>{
                if(!err){
                    req.user=decoded;
                }
            })
    }
    next();
    

})

const mongoUrl = process.env.MONGO_URL_STANDARD || process.env.MONGO_URL;

const connectToDatabase = async () => {
    if (!mongoUrl) {
        throw new Error("MONGO_URL is missing from the .env file");
    }

    await mongoose.connect(mongoUrl, {
        family: 4,
        serverSelectionTimeoutMS: 15000,
    });

    console.log("MongoDB connection established successfully");
};

app.use("/api/users",userRouter);
app.use("/api/products",productRouter);
app.use("/api/reviews",reviewRouter);
app.use("/api/inquiries",inquiryRouter);
app.use("/api/orders",orderRouter);
app.use("/api/packages", packageRouter);
app.use("/api/package-bookings", packageBookingRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/package-vehicles", packageVehicleRouter);
app.use("/api/addons", addonRouter);
app.use("/api/events",router);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/vehicle-bookings", vehicleBookingRouter);
app.use("/api/restaurants", restaurantRouter);
app.use("/api/food-orders", foodOrderRouter);
app.use("/api/rooms",           roomRouter);
app.use("/api/hotels",          hotelRouter);



// openapi call
app.post("/api/describe", async (req, res) => {
  try {
    const { place } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a travel guide. Write engaging, tourist-friendly descriptions.",
        },
        {
          role: "user",
          content: `Write a detailed, attractive travel description about ${place} in Sri Lanka. Include history, attractions, and visitor experience.`,
        },
      ],
    });

    res.json({
      description: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      description: "Failed to generate description.",
    });
  }
});



const startServer = async () => {
    try {
        await connectToDatabase();

        app.listen(5000,()=>{
            console.log("Server is running on port 5000")
        });
    } catch (error) {
        console.error("MongoDB connection failed.");
        console.error(error.message);

        if (mongoUrl?.startsWith("mongodb+srv://")) {
            console.error("Atlas checklist:");
            console.error("1. Add your current public IP to Atlas Network Access, or temporarily allow 0.0.0.0/0 for testing.");
            console.error("2. In Atlas > Connect > Drivers, copy the standard non-SRV connection string and save it as MONGO_URL_STANDARD in .env.");
            console.error("3. Make sure your database username and password are correct.");
        }

        process.exit(1);
    }
};

startServer();

//customer
// "email": "kusal1@example.com",
// "password": "123",

//Admin
// "email": "kusal2@example.com",
// "password": "123",



