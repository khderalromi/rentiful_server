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
      set: (val: number) => Math.round(val * 10) / 10,
    },
    numberOfReviews: {
      type: Number,
      default: 0,
    },
    locationId: {
      type: mongoose.Schema.ObjectId,
      ref: "Location",
      required: [true, "كل عقار يجب أن يكون له موقع"],
    },
    manager: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "كل عقار يجب أن يكون له مالك"],
    },
    reviews: {
      type: mongoose.Schema.ObjectId,
      ref: "Review",
    },
  },
  {
    timestamps: true,
  },
);

const Property = mongoose.model("Property", PropertySchema);
export default Property;
