import express from 'express';
import * as authController from './../controllers/AuthController.js';

const router = express.Router();

router
  .route('/signup')
  .post( authController.signup);


router
  .route('/login')
  .post( authController.login);


router.post('/forgotPassword', authController.forgotPassword);

router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);
router.get('/getMe', authController.getMe);
router.patch('/updateMe', authController.updateMe);
router.delete('/deleteMe', authController.deleteMe);
export default router;