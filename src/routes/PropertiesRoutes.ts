import express from "express";
export const router = express.Router();

import * as propertyController from "../controllers/PropertiesController.js";
import * as authController from "../controllers/AuthController.js"; // استدعاء متحكم الأمان

router.use(authController.protect);

import reviewRouter from "./ReviewsRoutes.js";
router.use("/:propertyId/reviews", reviewRouter);

import ApplicationRoutes from "./ApplicationRoutes.js";
router.use("/:propertyId/applications", ApplicationRoutes);

import LeasesRoutes from "./LeaseRoutes.js";
router.use("/:propertyId", LeasesRoutes);

router
  .route("/create")
  .post(
    authController.restrictTo("Manager"),
    propertyController.createProperty,
  );

router
  .route("/update/:id")
  .patch(
    authController.restrictTo("Manager"),
    propertyController.updateProperty,
  );

router
  .route("/filter")
  .get(
    authController.restrictTo("Tenant" , "Manager"),
    propertyController.findPropertyfilter,
  );

router
  .route("/delete/:id")
  .delete(
    authController.restrictTo("Manager"),
    propertyController.deleteProperty,
  );

router
  .route("/allProperties")
  .get(
    authController.restrictTo("Tenant", "Manager"),
    propertyController.getAllProperties,
  );

router
  .route("/property/:id")
  .get(authController.restrictTo("Tenant", "Manager"), propertyController.getProperty);

router
  .route("/nearBy/:distance/:latlng/:unit")
  .get(propertyController.getPropertiesWithinRadius);

export default router;
