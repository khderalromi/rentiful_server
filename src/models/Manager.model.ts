import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    min:[5, "يجب أن يكون الاسم من 5 حروف على الأقل"],
    required: [true, "يرجى إدخال الاسم"],
  },
  email: {
    type: String,
    required: [true, "يرجى إدخال البريد الإلكتروني"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "يرجى إدخال بريد إلكتروني صحيح"],
  },

  password: {
    type: String,
    required: [true, "يرجى إدخال كلمة المرور"],
    minlength: [ 8, "يجب أن تكون كلمة المرور من 8 أحرف على الأقل"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "يرجى تأكيد كلمة المرور"],
    validate: {
      validator: function (this: any, el: string): boolean {
        return el === this.password;
      },
      message: "كلمات المرور غير متطابقة",
    },
  },
  phoneNumber: {
    type: String,
    required: [true, "يرجى إدخال  رقم الهاتف"],
    unique: true,
    validate: {
      validator: function (val: string) {
        return /^\+963[0-9]{9}$/.test(val);
      },
      message: "رقم الهاتف غير صحيح يجب ان يبدأ ب +963",
    },
  },
  role: {
    type: String,
    enum: ["Manager", "Tenant"],
    default: "Tenant",
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.pre("save", async function (this: any) {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
});

userSchema.pre("save", function (this: any): void {
  if (!this.isModified("password") || this.isNew) return;

  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.pre(/^find/, function (this: any) {
  this.find({ active: { $ne: false } });
});

userSchema.methods.changedPasswordAfter = function (
  this: any,
  JWTTimestamp: number,
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000,
    );
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 دقائق بالملي ثانية

  return resetToken;
};

const User = mongoose.model("User", userSchema);
export default User;
