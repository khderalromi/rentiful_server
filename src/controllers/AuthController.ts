import User from '../models/Manager.model.js';
import catchAsync from '../utils/catchAsync.js'
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import { promisify } from 'util';
import crypto from 'crypto'; // مدمجة في Node.js لا تحتاج لتنصيب
import sendEmail from '../utils/email.js';
import Tenant from '../models/Tenant.model.js';



// دالة مساعدة لإنشاء التوكن
const signToken = (id:string) => {
  return jwt.sign({ id :id}, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN as any
  });
};


export const signup = catchAsync(async (req:any, res:any, next:any) => {
  const checkEmail= await User.findOne({ email: req.body.email });

  if(checkEmail) {return next (new AppError("This Email is already used ",400))}
  // لاحظ أننا نحدد الحقول التي نقبلها لزيادة الأمان
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    phoneNumber:req.body.phoneNumber,
    role: req.body.role // سنقوم بحماية هذا لاحقاً لمنع أي شخص من جعل نفسه Admin
  });
  const token = signToken((newUser._id as any).toString());

  res.status(201).json({
    status: 'success',
    token,  //ارساله للفرونت
    data: {
      user: newUser
    }
  });
});



///********login */
export const login = catchAsync(async (req:any, res:any, next:any) => {
  const { email, password } = req.body;

  // 1) التحقق من وجود الإيميل وكلمة المرور في الطلب
  if (!email || !password) {
    return next(new AppError('يرجى إدخال البريد الإلكتروني وكلمة المرور', 400));
  }

  // 2) البحث عن المستخدم والتأكد من كلمة المرور
  // استخدمنا .select('+password') لأننا وضعنا select: false في الـ Model
  const user = (await User.findOne({ email }).select('+password')) as any;

  // استخدام الدالة التي أنشأناها في الموديل للمقارنة
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401));
  }

  // 3) إذا كان كل شيء تمام، نرسل التوكن
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

//لأقوم بأخذ بيانات المستخدم وحفظها والتعامل معها بالفرونت
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

  // 1) جلب التوكن والتحقق مما إذا كان موجوداً في الـ Headers
  // العرف البرمجي (Best Practice) يملي أن يرسل التوكن في حقل Authorization ويبدأ بكلمة Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('أنت غير مسجل في النظام، يرجى تسجيل الدخول للوصول.', 401)
    );
  }

  // 2) التحقق من صحة التوكن (Verification)
  // jwt.verify عادة تعمل بـ Callback، لذلك حولناها لـ Promise باستخدام promisify
  const decoded = (await promisify(jwt.verify as any)(token, process.env.JWT_SECRET!)) as any;

  // 3) التحقق مما إذا كان المستخدم لا يزال موجوداً في قاعدة البيانات
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('المستخدم صاحب هذا التوكن لم يعد موجوداً في النظام.', 401)
    );
  }

  // 4) التحقق مما إذا كان المستخدم قد غير كلمة المرور بعد إصدار التوكن
  // (سنضيف الدالة الخاصة بها في الموديل في الخطوة القادمة، حالياً سنترك الشرط جاهزاً)
  if (typeof (currentUser as any).changedPasswordAfter === 'function' && (currentUser as any).changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('قام المستخدم بتغيير كلمة المرور مؤخراً! يرجى إعادة تسجيل الدخول.', 401)
    );
  }

  // منح الصلاحية للوصول وتخزين بيانات المستخدم في الـ req ليستفيد منها الميدلوير التالي
  req.user = currentUser;
  next();
});


const filterObj = (obj:Record<string, any>, ...allowedFields:string[]) => {
  const newObj : Record<string, any>  = {};
  // المرور على جميع المفاتيح الموجودة فيreq.body
  Object.keys(obj).forEach(el => {
    // إذا كان الحقل موجوداً ضمن الحقول المسموح بها، قم بنسخه
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const updateMe = catchAsync(async (req:any, res:any, next:any) => {
  // 1) إطلاق خطأ إذا حاول المستخدم إرسال بيانات كلمة المرور في هذا المسار
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('هذا المسار ليس لتحديث كلمة المرور. يرجى استخدام مسار /updateMyPassword.', 400)
    );
  }

  // 2) فلترة الـ body لمنع تغيير الحقول الحساسة مثل الـ role
  // سنسمح فقط بتغيير الاسم (name) والإيميل (email)
  const filteredBody = filterObj(req.body, 'name', 'email','phoneNumber');

  // 3) تحديث وثيقة المستخدم في قاعدة البيانات ببيانات الفلترة
  // الـ options: runValidators لضمان التحقق من صحة الإيميل الجديد، و new لإعادة البيانات الجديدة
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

//ملاحظة الدالة لا تعمل مع اي راوت بدون دالة بروتكت التي قبلها لأنها تأخذ اليوزر منها
export const restrictTo = (...roles: string[]) => {
  return (req:any, res:any, next:any) => {
    // 1) مصفوفة roles تحتوي على الأدوار المسموح لها (مثلاً: ['admin', 'doctor'])
    // 2) نقوم بفحص دور المستخدم الحالي المحفوظ في الطلب (req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('ليس لديك الصلاحية للقيام بهذا الإجراء.', 403)
      );
    }

    // إذا كان دور المستخدم موجوداً ضمن الأدوار المسموح لها، ننتقل للميدلوير التالي
    next();
  };
};


export const forgotPassword = catchAsync(async (req:any, res:any, next:any) => {
  // 1) البحث عن المستخدم بناءً على الإيميل المرسل
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('لا يوجد مستخدم مسجل بهذا البريد الإلكتروني.', 404));
  }

  // 2) توليد التوكن العشوائي (باستخدام الدالة التي أنشأناها في الموديل)
  const resetToken = (user as any).createPasswordResetToken();
  
  // حفظ التغييرات في قاعدة البيانات (مع إلغاء تفعيل الـ validators لحقول الباسورد الأخرى لأننا لا نعدلها الآن)
  await user.save({ validateBeforeSave: false });

  // 3) بناء الرابط الذي سيرسل للمستخدم
  // في بيئة التطوير يكون الرابط يشير للـ localhost
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
const message = `هل نسيت كلمة المرور الخاصة بك؟ يرجى إرسال طلب PATCH مع كلمة المرور الجديدة وتأكيدها إلى الرابط التالي:\n\n${resetURL}\n\nإذا لم تكن أنت من طلب هذا، يرجى تجاهل هذا الإيميل وسيظل حسابك آمناً ونشطاً لـ 10 دقائق فقط.`;

  // 4) محاولة إرسال الإيميل عبر تكتيك try-catch خاص لحماية التوكن
  try {
    await sendEmail({
      email: user.email,
      subject: 'رابط استعادة كلمة المرور (صالح لـ 10 دقائق)',
      message
    });

    // إذا نجح الإرسال، نرسل استجابة نجاح نظيفة للمستخدم دون كشف الرابط في الـ JSON
    res.status(200).json({
      status: 'success',
      message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح!'
    });

  } catch (err) {
    // 💡 تفصيل بمستوى سينيور محترف:
    // إذا فشل إرسال الإيميل لأي سبب (مثلاً مشكلة في السيرفر أو الإيميل وهمي)، 
    // يجب فوراً مسح التوكن من الداتابيز حتى لا يظل معلقاً وصالحاً للاستغلال.
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('حدث خطأ أثناء إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً.', 500)
    );
  }
});


export const resetPassword = catchAsync(async (req:any, res:any, next:any) => {
  // 1) تشفير التوكن القادم من الرابط لمطابقته مع التوكن المخزن في الداتابيز
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 2) البحث عن المستخدم الذي يملك هذا التوكن وبشرط أن وقت الصلاحية لم ينتهِ بعد
  // $gt تعني (Greater Than) أي أن وقت انتهاء الصلاحية يجب أن يكون أكبر من الوقت الحالي
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 3) إذا لم يجد المستخدم أو انتهت الصلاحية، نرسل خطأ
  if (!user) {
    return next(new AppError('التوكن غير صحيح أو انتهت صلاحيته (10 دقائق).', 400));
  }

  // 4) إذا كان التوكن صحيحاً، نقوم بتحديث كلمة المرور الجديدة
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  
  // تنظيف حقول التوكن بعد استخدامها لمرة واحدة بنجاح (الأمان أولاً!)
  (user as any).passwordResetToken = undefined;
  (user as any).passwordResetExpires = undefined;

  // حفظ التغييرات (هنا ستعمل الـ Validators لتشفير الباسورد الجديد والتأكد من مطابقتها)
  await user.save();

  // 5) تحديث تاريخ تغيير كلمة المرور (سندير هذا عبر Middleware في الموديل بعد قليل ليكون تلقائياً)

  // 6) تسجيل دخول المستخدم تلقائياً عن طريق إرسال توكن JWT جديد له
  const token = signToken((user as any)._id);

  res.status(200).json({
    status: 'success',
    token,
    message: 'تم تغيير كلمة المرور بنجاح وتم تسجيل دخولك!'
  });
});

export const deleteMe = catchAsync(async (req:any, res:any, next:any) => {
  // تحويل حقل النشاط إلى false بناءً على الـ ID المستخرج من ميدلوير الـ protect
  await User.findByIdAndUpdate(req.user.id, { active: false });

  // طبقاً لبروتوكول HTTP، عند الحذف الناجح نرسل كود الحالة 204 (No Content) وبدون data
  res.status(204).json({
    status: 'success',
    data: null
  });
});