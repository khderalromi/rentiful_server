import mongoose from "mongoose";
import Property from "./Property.model.js";
import AppError from "../utils/appError.js";
const paymentSchema = new mongoose.Schema(
  {
    amountDue: {
      type: Number,
      required:true,
    },
    amountPaid: {
      type: Number,
      required:true,
    },
    dueDate: {
      type: Date,
      required:true,
    },
    paymentDate: {
      type: Date,
      required:true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "PartiallyPaid", "Overdue"],
      default: "Pending",
      required:true,
    },
    lease: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lease",
        required: true,
    }
  },
  {
    timestamps: true, // يضيف حقول createdAt و updatedAt تلقائياً
  }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
