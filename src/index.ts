import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose"
/*ROUTE IMPORT*/
dotenv.config();
const app=express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({policy: "cross-origin"}));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
/* 1. إعداد CORS بالسماح لمنفذ الفرونت إند 3000 */
const allowedOrigins = [
  "http://localhost:3000",
  "https://rentiful-client-5.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
/*CONNECT TO DB*/
const mongoUri = process.env.MONGODB_URI as string
mongoose.connect(mongoUri)
  .then(() => {console.log("✅ SUCCESS: Connected to MongoDB Atlas!")
    // استدعاء الدالة للتجربة (يمكنك استدعاؤها بعد نجاح الاتصال بقاعدة البيانات)
    //createNewProject();
  }
  ).catch(err => {
    console.log("❌ CONNECTION FAILED");
    console.log("Reason:", err.message);
  });
/*ROUTES*/

import userRoutes from './routes/UserRoutes.js';
app.use('/', userRoutes);

import propertiesRoutes from './routes/PropertiesRoutes.js';
app.use('/properties', propertiesRoutes);

import tenantRoutes from './routes/TenantRoutes.js';
app.use('/tenant', tenantRoutes);


import applicationRoutes from './routes/ApplicationRoutes.js';
app.use('/applications', applicationRoutes);


import leasesRoutes from './routes/LeaseRoutes.js';
app.use('/leases', leasesRoutes);


import paymentsRoutes from './routes/PaymentRoutes.js';
import AppError from "./utils/appError.js";
app.use('/payments', paymentsRoutes);

/* ERROR HANDLING */

// 1. Handle routes that do not exist
app.use((req, res, next) => {
  next(
    new AppError(
      `Route ${req.originalUrl} not found on this server`,
      404
    )
  );
});

// 2. Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    // Handle invalid JSON sent by the client
    if (err.type === "entity.parse.failed") {
      err.statusCode = 400;
      err.status = "fail";
      err.message = "Invalid JSON format in request body";
    }

    // Handle invalid or expired JWT
    if (err.name === "JsonWebTokenError") {
      err.statusCode = 401;
      err.status = "fail";
      err.message = "Invalid authentication token. Please log in again.";
    }

    if (err.name === "TokenExpiredError") {
      err.statusCode = 401;
      err.status = "fail";
      err.message ="Your session has expired. Please log in again.";
    }

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      err.statusCode = 400;
      err.status = "fail";
      err.message = "Invalid input data";
    }

    // Handle duplicate MongoDB fields, such as duplicate email
    if (err.code === 11000) {
      err.statusCode = 400;
      err.status = "fail";
      err.message = "This information is already registered";
    }

    // Handle invalid MongoDB ObjectId
    if (err.name === "CastError") {
      err.statusCode = 400;
      err.status = "fail";
      err.message = "Invalid resource ID";
    }

    const statusCode =
      Number.isInteger(err.statusCode) &&
      err.statusCode >= 400 &&
      err.statusCode <= 599
        ? err.statusCode
        : 500;

    const isProduction = process.env.NODE_ENV === "production";

    res.status(statusCode).json({
      status: statusCode < 500 ? "fail" : "error",
      message:
        statusCode >= 500 && isProduction
    ? "An internal server error occurred. Please try again later."
    : err.message || "An unexpected error occurred",
    ...(isProduction ? {} : { stack: err.stack }),
    });
  }
);

/* SERVER */
const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`SERVER RUNNING ON PORT ${port}`);
});