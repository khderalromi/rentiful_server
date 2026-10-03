import express from "express";
const router = express.Router({ mergeParams: true });

import * as authController from "./../controllers/AuthController.js";
import * as paymentController from "./../controllers/PaymentController.js";

router.use(authController.protect);

router
  .route("/createPayment")
  .post(authController.restrictTo("Manager"), paymentController.createPayment);

router
  .route("/all")
  .get(
    authController.restrictTo("Manager", "Tenant"),
    paymentController.getPayments,
  );

router
  .route("/:paymentId/pay")
  .patch(
    authController.restrictTo("Manager"),
    paymentController.changePaymentStatus,
  );

export default router;
