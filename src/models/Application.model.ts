import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled", "completed"],
      default: "pending",
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
    message: {
      type: String,
      required: true,
    },
    lease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lease",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

applicationSchema.pre("save", async function (this: any) {
  const existingApplication = await this.constructor.findOne({
    tenant: this.tenant,
    property: this.property,
    status: "confirmed",
  });

  if (existingApplication) {
    throw new Error("هذا الطلب محجوز مسبقاً، يرجى اختيار عقار آخر.");
  }
});

const Application = mongoose.model("Application", applicationSchema);
export default Application;
