import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "يرجى إدخال اسم العقار"],
    },
    description: {
      type: String,
      required: [true, "يرجى إدخال  مواصفات العقار"],
    },
    pricePerMonth: {
      type: String,
      required: [true, "يرجى  ادخال الأجار الشهري للعقار"],
    },
    securityDeposit: {
      type: Number,
      required: [true, "يرجى إدخال المبلغ التأميني للعقار"],
    },
    applicationFee: {
      type: String,
      required: [true, "يرجى إدخال رسوم طلب الأجار"],
    },
    photoUrls: {
      type: [String],
      required: [true, "يرجى إدخال الرمز البريدي"],
    },
    amenities: {
      type: [String],
      required: [true, " ادخل الخدمات  المتوفرة لديك"],
    },
    highLights: {
      type: [String],
      required: [true, "أدخل ميزات العقار الخاص بك"],
    },
    isPetsAllowed: {
      type: Boolean,
      required: [true, "هل تسمح بوجود الحيوانات الأليفة"],
    },
    isParkingIncluded: {
      type: Boolean,
      required: [true, "هل الكراج متاح ؟"],
    },
    beds: {
      type: Number,
      required: [true, "يرجى إدخال عدد الأسرة"],
    },
    baths: {
      type: Number,
      required: [true, "يرجى إدخال عدد دورات المياه/ الحمامات"],
    },
    squareFeet: {
      type: Number,
      required: [true, "يرجى إدخال مساحة العقار"],
    },
    propertyType: {
      type: String,
      required: [true, "يرجى إدخال نوع العقار"],
    },
    postedDate: {
      type: Date,
      required: [true, "يرجى إدخال تاريخ النشر"],
    },
    Averageratings: {
      type: Number,
      default: 4.5,
      set: (val:number) => Math.round(val * 10) / 10, // تقريب الرقم (مثل 4.666 إلى 4.7)
    },
    numberOfReviews: {
      type: Number,
      default: 0,
    },
    locationId: {
        type: mongoose.Schema.ObjectId, // نوع البيانات هو المعرف الفريد الخاص بـ MongoDB
        ref: 'Location', // "السلك" موصل بموديل اسمه Clinic
        required: [true, 'كل عقار يجب أن يكون له موقع'] // هذا الحقل إجباري مع رسالة خطأ مخصصة
    },
    manager: {
        type: mongoose.Schema.ObjectId, // نوع البيانات هو المعرف الفريد الخاص بـ MongoDB
        ref: 'User', // "السلك" موصل بموديل اسمه Clinic
        required: [true, 'كل عقار يجب أن يكون له مالك'] // هذا الحقل إجباري مع رسالة خطأ مخصصة
    },
    reviews: {
        type: mongoose.Schema.ObjectId, // نوع البيانات هو المعرف الفريد الخاص بـ MongoDB
        ref: 'Review', // "السلك" موصل بموديل اسمه Clinic
        
    },
  },
  {
    timestamps: true, // لتسجيل وقت الإنشاء والتحديث تلقائياً
  },
);
/*
PropertySchema.pre(/^find/, function(this:any) {
  this.populate({
    path: 'manager',
    select: 'name'
  }).populate({
    path: 'locationId',
    select: 'city state postalCode coordinates'
  }).populate({
    path: 'reviews',
    select: 'reviews'
  });
});
*/

const Property = mongoose.model("Property", PropertySchema);
export default Property;
