import * as PaymentModule from "../models/Payment.model.js";
import * as LeaseModule from "../models/Leases.model.js";
import AppError from "../utils/appError.js";

const Payment =
  (PaymentModule as any).default ??
  (PaymentModule as any).Payment ??
  PaymentModule;
const Lease =
  (LeaseModule as any).default ?? (LeaseModule as any).Lease ?? LeaseModule;

export const createPayment = async (req: any, res: any, next:any) => {
    console.log("✅ leaseId:", req.params.leaseId);
    console.log("✅ req.body:", req.body);
    //if (!req.body.leaseId) req.body.leaseId = req.params.leaseId;
    
    const lease = await Lease.findById(req.params.leaseId)
      .populate({
        path: "property",
        select: "name description pricePerMonth _id  ",
      })
      .populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ",
      });
      console.log("lease" + lease)
    if (!lease) {
      return next (new AppError("Lease not found.", 404))
    }
    if (lease && lease.endDate >= new Date()) {
      const newPayment = await Payment.create({...req.body, lease:req.params.leaseId})
      console.log("new payment" + newPayment)
      return res.status(201).json(newPayment);
    }
    return next(new AppError("Lease has expired.",409))
 
};

export const getPayments = async (req: any, res: any, next: any) => {
  
    //if (!req.body.leaseId) req.body.leaseId = req.params.leaseId;
    const payments = await Payment.find({ lease: req.params.leaseId }).populate(
      {
        path: "lease",
        select: "startDate endDate rent deposit property tenant _id  ",
      },
    );

    if (!payments) {
      return next(new AppError("No payments for this lease",400))
;
    }
    res.status(200).json(payments);
  
};
export const getPaymentsByProperty = async (req: any, res: any) => {
        const propertyId  = req.params.propertyId;

        const propertyLeases = await Lease.find({ property: propertyId }).select('_id');
        const leaseIds = propertyLeases.map((lease: any) => lease._id);
        const payments = await Payment.find({ lease: { $in: leaseIds } });
        res.status(200).json({ data: payments });

    
};

export const changePaymentStatus = async (req: any, res: any, next:any) => {
    if (!req.body.paymentId) req.body.paymentId = req.params.paymentId;
    const payments = await Payment.findByIdAndUpdate(
      { _id: req.params.paymentId },
      { paymentStatus: req.body.paymentStatus },
      { new: true },
    ).populate({
      path: "lease",
      select: "startDate endDate rent deposit property tenant _id  ",
    });

    if (!payments) {
      return next(new AppError("Payment not found",404))
    }
    res.status(200).json(payments);
 
};
