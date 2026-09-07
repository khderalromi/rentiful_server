import express from 'express';
const router = express.Router({mergeParams: true});

import * as authController from './../controllers/AuthController.js';

import * as propertiesController from './../controllers/PropertiesController.js';

import * as reviewsController from './../controllers/ReviewsController.js';


router.use(authController.protect);

// 2. المسارات العامة للبحث والإضافة
router
  .route('/create')
  .post(authController.restrictTo('Manager' , 'Tenant'), reviewsController.createReview);

  router
  .route('/propertyReview')
  .get(authController.restrictTo('Manager' , 'Tenant'), propertiesController.getPropertyReviews);


  
export default router; 