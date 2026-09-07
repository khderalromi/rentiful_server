import mongoose from "mongoose";
import Property from "./Property.model.js";
import AppError from "../utils/appError.js";
const leasesSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rent: {
      type: Number,
      required: true,
    },
    deposit: {
      type: Number,
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // يضيف حقول createdAt و updatedAt تلقائياً
  },
);
/*
leasesSchema.pre(/^find/, function (this: any) {
  this.populate({
    path: "tenant",
    select: "name email phoneNumber congitoId _id ", // نحن لا نحتاج إلى جميع حقول الطبيب، فقط اسمه
  }).populate({
    path: "property",
    select: "name description pricePerMonth _id  ", // نحن لا نحتاج إلى جميع حقول العقار، فقط بعضها
  })
});
*/
const Lease = mongoose.model("Lease", leasesSchema);
export default Lease;
