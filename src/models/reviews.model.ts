import mongoose from "mongoose";
import Property from "./Property.model.js";
const reviewsSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.ObjectId, // نوع البيانات هو المعرف الفريد الخاص بـ MongoDB
      ref: "Property", // "السلك" موصل بموديل اسمه Doctor
      required: [true, "كل مراجعة لها عقار مرتبط بها"], // هذا الحقل إجباري مع رسالة خطأ مخصصة
    },
    reviews: {
      type: String,
    },
    rating: {
      type: Number,
      required: [true, " ادخل التقييم كرقم من 5"], // هذا الحقل إجباري مع رسالة خطأ مخصصة
    },
  },
  {
    timestamps: true, // يضيف حقول createdAt و updatedAt تلقائياً
  },
);

reviewsSchema.statics.calcAverageRatings = async function (propertyId: string) {
  // this هنا تشير إلى الـ Model (Review)
  const stats = await this.aggregate([
    {
      $match: { property: propertyId }, // 1. اختر المراجعات الخاصة بهذا الطبيب فقط
    },
    {
      $group: {
        _id: "$property",
        nRating: { $sum: 1 }, // 2. احسب عدد المراجعات
        avgRating: { $avg: "$rating" }, // 3. احسب متوسط التقييمات
      },
    },
  ]);

  // 4. تحديث وثيقة المشروع بالنتائج الجديدة
  if (stats.length > 0) {
    await Property.findByIdAndUpdate(propertyId, {
      Averageratings: stats[0].avgRating,
      numberOfReviews: stats[0].nRating,
    });
  } else {
    // إذا حذفت كل المراجعات، نعود للقيم الافتراضية
    await Property.findByIdAndUpdate(propertyId, {
      Averageratings: 4.5,
    });
  }
};

// استدعاء الدالة بعد إنشاء مراجعة جديدة
reviewsSchema.post("save", function (this: any) {
  // this تشير إلى المراجعة التي تم حفظها الآن
  // this.constructor تشير إلى موديل الـ Review
  console.log(this.property)
  this.constructor.calcAverageRatings(this.property);
});
// الحيلة: نستخدم pre للوصول للوثيقة قبل حذفها/تعديلها
reviewsSchema.pre(/^findOneAnd/, async function (this: any, next: any) {
  // نحصل على الوثيقة الحالية ونخزنها في r لكي نستخدمها في الـ post
  this.r = await this.findOne();
  next();
});

reviewsSchema.post(/^findOneAnd/, async function (this: any) {
  // الآن نستدعي الحساب باستخدام الـ ID الذي خزنّاه
  await this.r.constructor.calcAverageRatings(this.r.property);
});


// تعريف الـ Schema
// تحويل الـ Schema إلى Model وتصديره
const Review = mongoose.model("Review", reviewsSchema);
export default Review;
