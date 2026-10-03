import express from "express";
const router = express.Router({ mergeParams: true });

import * as authController from "./../controllers/AuthController.js";
import * as ApplicationController from "./../controllers/ApplicationController.js";

import leaseRoutes from "./LeaseRoutes.js";
router.use("/:applicationId/leases", leaseRoutes);

router.use(authController.protect);

router
  .route("/create")
  .post(
    authController.restrictTo("Tenant"),
    ApplicationController.createApplication,
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
