import express from "express";
const router = express.Router({ mergeParams: true });

import * as authController from "./../controllers/AuthController.js";
import * as paymentController from "./../controllers/PaymentController.js";

router.use(authController.protect);

router
  .route("/:leaseId/createPayment")
  .post(authController.restrictTo("Manager"), paymentController.createPayment);

router
  .route("/:leaseId/payments/all")
  .get(
    authController.restrictTo("Manager"),
    paymentController.getPayments,
  );

router
  .route("/:propertyId/payments-property")
  .get(
    authController.restrictTo("Manager"),
    paymentController.getPaymentsByProperty,
  );
router
  .route("/:paymentId/pay")
  .patch(
    authController.restrictTo("Manager"),
    paymentController.changePaymentStatus,
  );

export default router;
