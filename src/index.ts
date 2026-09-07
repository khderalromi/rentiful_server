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
app.use(cors());

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


/*SERVER*/
const port =process.env.PORT || 3002;
app.listen(port, ()=>{
    console.log(`SERVER RUNNING ON PORT ${port}`)
})