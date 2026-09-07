import express from "express";
export const router = express.Router();

import * as propertyController from "../controllers/PropertiesController.js";
import * as authController from "../controllers/AuthController.js"; // استدعاء متحكم الأمان

router.use(authController.protect);

//nested  routes
import reviewRouter from "./ReviewsRoutes.js";
router.use("/:propertyId/reviews", reviewRouter);

import ApplicationRoutes from "./ApplicationRoutes.js";
router.use("/:propertyId/applications", ApplicationRoutes);


import LeasesRoutes from "./LeaseRoutes.js";
router.use("/:propertyId", LeasesRoutes);


// 2. المسارات العامة للبحث والإضافة
router
  .route("/create")
  //.get(propertyController.findClinicfilter)
  .post(
    authController.restrictTo("Manager"),
    propertyController.createProperty,
  );

// 3. المسارات التي تعتمد على ID
router
  .route("/update/:id")
  .patch(
    authController.restrictTo("Manager"),
    propertyController.updateProperty,
  );
//.delete(propertyController.deleteClinic);

// 3. المسارات التي تعتمد على ID
router
  .route("/filter")
  .get(
    authController.restrictTo("Manager"),
    propertyController.findPropertyfilter,
  );
//.delete(propertyController.deleteClinic);

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
  .get(
    authController.restrictTo("Manager"),
    propertyController.getProperty,
  );


  // تأكد من استدعاء الدالة من الكنترولر
// router.use(authController.protect); (إذا أردت حمايته)

router
  .route('/nearBy/:distance/:latlng/:unit')
  .get(propertyController.getPropertiesWithinRadius);


  
export default router;
