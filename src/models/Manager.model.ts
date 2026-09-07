import mongoose from 'mongoose'
import validator from 'validator'; // مكتبة للتحقق من صحة الإيميل
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // مدمجة في Node.js لا تحتاج لتنصيب

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'يرجى إدخال الاسم']
  },
  email: {
    type: String,
    required: [true, 'يرجى إدخال البريد الإلكتروني'],
    unique: true,
    lowercase: true, // تحويل الإيميل دائماً لأحرف صغيرة
    validate: [validator.isEmail, 'يرجى إدخال بريد إلكتروني صحيح']
  },
  
  password: {
    type: String,
    required: [true, 'يرجى إدخال كلمة المرور'],
    minlength: 8,
    select: false // أهم نقطة: كلمة المرور لن تظهر أبداً في أي عملية جلب بيانات تلقائياً
  },
  passwordConfirm: {
    type: String,
    required: [true, 'يرجى تأكيد كلمة المرور'],
    validate: {
      // هذا يعمل فقط عند الحفظ (SAVE) أو الإنشاء (CREATE)
      validator: function(this:any,el :string):boolean {
        return el === this.password;
      },
      message: 'كلمات المرور غير متطابقة'
    }
  },
  phoneNumber: {
    type: String,
    required: [true, 'يرجى إدخال  رقم الهاتف'],
    unique: true,
    validate: {
    validator: function(val:string) {
      // نتحقق أن الرقم يبدأ بـ +963 ويتبعه 9 أرقام (المجموع 12 خانة مع الزائد)
      // ^: البداية، \+: علامة الزائد، [0-9]{12}: يجب أن يكون الطول الإجمالي 12 رقم
      return /^\+963[0-9]{9}$/.test(val);
    },
    message: 'رقم الهاتف غير صحيح يجب ان يبدأ ب +963'
  }
  },
  cognitoId: {
  type: String,
  required: [true, 'يرجى إدخال معرف CONGITO'],
  unique: true
  },
  role: {
    type: String,
    enum: ['Manager','Tenant'],
    default: 'Tenant'
  },
  active: {
  type: Boolean,
  default: true,
  select: false // نخفيه لكي لا يظهر في استعلامات البحث العادية دون داعٍ
},
  passwordChangedAt: Date,
  passwordResetToken: String ,
  passwordResetExpires: Date
});


userSchema.methods.correctPassword = async function(candidatePassword:string, userPassword:string):Promise<boolean> {
  // candidatePassword: الكلمة التي كتبها المستخدم الآن
  // userPassword: الكلمة المشفرة في قاعدة البيانات
  return await bcrypt.compare(candidatePassword, userPassword);
};
// تش   فير كلمة المرور قبل الحفظ
userSchema.pre('save', async function(this:any) {
  // 1) إذا لم يتم تعديل كلمة المرور (مثلاً تم تعديل الاسم فقط)، انتقل للخطوة التالية
  if (!this.isModified('password')) return ;

  // 2) تشفير الكلمة بقوة (Cost Factor) تساوي 12
  // كلما زاد الرقم زادت قوة التشفير ولكن زاد وقت المعالجة
  this.password = await bcrypt.hash(this.password, 12);

  // 3) حذف حقل تأكيد كلمة المرور لأنه لا يلزمنا في الداتابيز بعد التحقق
  this.passwordConfirm = undefined;
  
  
  ;
});


userSchema.pre('save', function(this:any): void {
  // إذا لم يتم تعديل حقل الباسورد، أو كانت الوثيقة جديدة تماماً (تنشأ لأول مرة)، انتقل للميدلوير التالي
  if (!this.isModified('password') || this.isNew) return ;

  // نضع تاريخ التغيير الحالي، ونطرح ثانية واحدة (1000ms) للأمان، لأن حفظ البيانات في الداتابيز
  // قد يأخذ أجزاء من الثانية مما يجعل تاريخ التوكن أقدم بقليل ويسبب مشكلة في دالة protect
  this.passwordChangedAt = Date.now() - 1000;
 ;
});

userSchema.pre(/^find/, function(this:any) {
  // الكلمة المفتاحية this تشير هنا إلى الـ Query الحالي
  // سنضيف شرطاً خفياً يبحث فقط عن الحسابات التي ليست false
  this.find({ active: { $ne: false } });
  ;
});


userSchema.methods.changedPasswordAfter = function( this:any, JWTTimestamp:number):boolean {
  if (this.passwordChangedAt) {
    // تحويل التاريخ إلى ثوانٍ لمقارنته مع الطابع الزمني للـ JWT (iat)
    //const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    // إذا كان تاريخ تغيير الباسورد أحدث من تاريخ إصدار التوكن، يعيد true (يعني التوكن ملغي)
    return JWTTimestamp < changedTimestamp;
  }

  // false تعني لم يتم تغيير كلمة المرور بعد إصدار التوكن
  return false;
};



userSchema.methods.createPasswordResetToken = function() {
  // 1) توليد نص عشوائي غير مفهوم مكون من 32 بايت وتحويله لـ Hex
  const resetToken = crypto.randomBytes(32).toString('hex');

  // 2) تشفير التوكن لحفظه في قاعدة البيانات لحمايته في حال اختراق الداتابيز
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 3) تحديد وقت انتهاء صلاحية التوكن (مثلاً: 10 دقائق فقط)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق بالملي ثانية

  // 4) إرسال التوكن الأصلي (غير المشفر) بالإيميل للمستخدم
  return resetToken;
};

const User = mongoose.model('User', userSchema);
export default User;