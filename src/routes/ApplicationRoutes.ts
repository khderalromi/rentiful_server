import express from "express";
const router = express.Router({ mergeParams: true });

import * as authController from "./../controllers/AuthController.js";
import * as ApplicationController from "./../controllers/ApplicationController.js";

router.use(authController.protect);
import leaseRoutes from "./LeaseRoutes.js";
router.use("/:applicationId/leases", leaseRoutes);


router
  .route("/create")
  .post(
    authController.restrictTo("Tenant"),
    ApplicationController.createApplication,
  );

router
  .route("/all-Applications")
  .get(
    authController.restrictTo("Tenant","Manager"),
    ApplicationController.getApplications,
  );


router
  .route("/tenantApplications")
  .get(
    authController.restrictTo("Tenant"),
    ApplicationController.getTenantApplications,
  );

router
  .route("/propertyApplications")
  .get(
    authController.restrictTo("Manager"),
    ApplicationController.getPropertyApplications,
  );

router
  .route("/:applicationId/status")
  .patch(
    authController.restrictTo("Manager"),
    ApplicationController.changeStatus,
  );

router
  .route("/:applicationId/cancel")
  .patch(
    authController.restrictTo("Manager"),
    ApplicationController.cancelApplication,
  );

export default router;
