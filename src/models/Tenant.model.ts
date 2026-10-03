import mongoose from "mongoose";
import AppError from "../utils/appError.js";
const tenantSchema = new mongoose.Schema(
  {
    favourites: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Property",
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

tenantSchema.methods.notRepeatFav = function (
  propertyId: string | number,
  next: any,
) {
  if (this.favourites.includes(propertyId)) {
    return next(new AppError("Property is already in favourites", 400));
  }

  return next();
};

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
