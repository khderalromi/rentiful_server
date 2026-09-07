import express from 'express';
const router = express.Router({mergeParams: true});

import * as authController from './../controllers/AuthController.js';

import * as leaseController from './../controllers/LeaseController.js';

import * as ApplicationController from './../controllers/ApplicationController.js';


import paymentRouter from "./PaymentRoutes.js";
router.use("/:leaseId/payments", paymentRouter);

router.use(authController.protect);

// 2. المسارات العامة للبحث والإضافة
router
  .route('/createLease')
  .post(authController.restrictTo('Manager'), leaseController.createLease);

  router
  .route('/tenantLeases')
  .get(authController.restrictTo('Tenant'), leaseController.getTenantLeases);

  
  router
  .route('/leases')
  .get(authController.restrictTo('Manager'), leaseController.getPropertyLeases);

  
  
export default router; 