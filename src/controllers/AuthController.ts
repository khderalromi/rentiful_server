import User from '../models/Manager.model.js';
import catchAsync from '../utils/catchAsync.js'
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import { promisify } from 'util';
import crypto from 'crypto';
import sendEmail from '../utils/email.js';
import Tenant from '../models/Tenant.model.js';



const signToken = (id:string) => {
  return jwt.sign({ id :id}, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN as any
  });
};


export const signup = catchAsync(async (req:any, res:any, next:any) => {
  const checkEmail= await User.findOne({ email: req.body.email });

  if(checkEmail) {return next (new AppError("This Email is already used ",400))}
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    phoneNumber:req.body.phoneNumber,
    role: req.body.role
  });
  const token = signToken((newUser._id as any).toString());

  res.status(201).json({
    status: 'success',
    token,  
    data: {
      user: newUser
    }
  });
});



///********login */
export const login = catchAsync(async (req:any, res:any, next:any) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide both email and password.', 400));
  }
  const user = (await User.findOne({ email }).select('+password')) as any;

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
    user: {
    name: user.name,
    email: user.email,
    _id: user._id
  }
  });
});

export const getMe = catchAsync(async (req:any, res:any) => {
  let userProfile = null
  if (req.user.role == "Tenant") {
    userProfile = await Tenant.findOne({tenant : req.user._id}).populate("favourites")
    console.log(userProfile)
  }
  res.status(200).json({ status: 'success', data: {
      user: req.user,       
      userInfo: userProfile
    } });
})

export const protect = catchAsync(async (req: any, res:any, next:any) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to access this resource.', 401)
    );
  }

  const decoded = (await promisify(jwt.verify as any)(token, process.env.JWT_SECRET!)) as any;

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user associated with this token no longer exists.', 401)
    );
  }
  if (typeof (currentUser as any).changedPasswordAfter === 'function' && (currentUser as any).changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Your password has recently changed. Please log in again.', 401)
    );
  }

  req.user = currentUser;
  next();
});


const filterObj = (obj:Record<string, any>, ...allowedFields:string[]) => {
  const newObj : Record<string, any>  = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const updateMe = catchAsync(async (req:any, res:any, next:any) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('This endpoint is not intended for password updates. Please use the /updateMyPassword endpoint.', 400)
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email','phoneNumber');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

export const restrictTo = (...roles: string[]) => {
  return (req:any, res:any, next:any) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};


export const forgotPassword = catchAsync(async (req:any, res:any, next:any) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user is registered with this email address.', 404));
  }

  const resetToken = (user as any).createPasswordResetToken();
  
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
const message = `Forgot your password? Please send a PATCH request with your new password and password confirmation to the following URL::\n\n${resetURL}\n\n
If you did not request this, please ignore this email. The password reset link will expire in 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Link (Expires in 10 Minutes)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'A password reset link has been sent to your email address.'
    });

  } catch (err) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('An error occurred while sending the email. Please try again later.', 500)
    );
  }
});


export const resetPassword = catchAsync(async (req:any, res:any, next:any) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid or expired password reset token. The token is valid for 10 minutes.', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  
  (user as any).passwordResetToken = undefined;
  (user as any).passwordResetExpires = undefined;

  await user.save();


  const token = signToken((user as any)._id);

  res.status(200).json({
    status: 'success',
    token,
    message: 'Your password has been changed successfully, and you are now logged in.'
  });
});

export const deleteMe = catchAsync(async (req:any, res:any, next:any) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});