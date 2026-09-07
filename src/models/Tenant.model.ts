import mongoose from "mongoose";
import Property from "./Property.model.js";
import AppError from "../utils/appError.js";
const tenantSchema = new mongoose.Schema(
  {
    favourites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Property",
    },
    tenant:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // يضيف حقول createdAt و updatedAt تلقائياً
  }
);


tenantSchema.methods.notRepeatFav = function (propertyId: string | number, next: any) {
  if (this.favourites.includes(propertyId)) {
    return next(new AppError("Property is already in favourites", 400));
  }

  return next();
};


/*
tenantSchema.pre(/^find/, function (this: any) {
  this.populate({
    path: "tenant",
    select: "name email phoneNumber congitoId _id ", // نحن لا نحتاج إلى جميع حقول الطبيب، فقط اسمه
  }).populate({
    path: "favourites",
    select: "name description pricePerMonth _id  ", // نحن لا نحتاج إلى جميع حقول العقار، فقط بعضها
  })
});
*/

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
