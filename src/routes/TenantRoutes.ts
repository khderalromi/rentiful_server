import express from 'express';
const router = express.Router({mergeParams: true});

import * as authController from './../controllers/AuthController.js';
import * as tenantController from './../controllers/TenantController.js';


import ApplicationRoutes from "./ApplicationRoutes.js";
router.use("/applications", ApplicationRoutes);


router.use(authController.protect);

router
  .route('/addFav/:propertyId')
  .post(authController.restrictTo('Tenant'), tenantController.addToFavourite);

router
  .route('/favourites')
  .get(authController.restrictTo('Tenant'), tenantController.getAllTenantFavourites);


router
  .route('/deleteFav/:propertyId')
  .patch(authController.restrictTo('Tenant'), tenantController.deletePropertyFromFav);


export default router; 