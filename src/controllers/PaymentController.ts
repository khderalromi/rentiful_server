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
  try {
    console.log("start")
    // الآن آمن
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
      return res.status(404).json({ message: "العقد غير موجود" });
    }
    if (lease && lease.endDate >= new Date()) {
      const newPayment = await Payment.create({...req.body, lease:req.params.leaseId})
      console.log("new payment" + newPayment)
      return res.status(201).json(newPayment);
    }
    return next(new AppError("this lease date is end",400))
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getPayments = async (req: any, res: any) => {
  try {
    //if (!req.body.leaseId) req.body.leaseId = req.params.leaseId;
    const payments = await Payment.find({ lease: req.params.leaseId }).populate(
      {
        path: "lease",
        select: "startDate endDate rent deposit property tenant _id  ",
      },
    );

    if (!payments) {
      return res.status(404).json({ message: "لا توجد مدفوعات لهذا العقد" });
    }
    res.status(200).json(payments);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
export const getPaymentsByProperty = async (req: any, res: any) => {
    try {
        const propertyId  = req.params.propertyId;

        // 1. جلب كافة الـ IDs للعقود التابعة لهذا العقار
        const propertyLeases = await Lease.find({ property: propertyId }).select('_id');
        const leaseIds = propertyLeases.map((lease: any) => lease._id);
   console.log(propertyLeases)
      console.log(leaseIds)

        // 2. جلب جميع الدفعات التي تنتمي لأي عقد من هذه العقود
        const payments = await Payment.find({ lease: { $in: leaseIds } });

        res.json({ data: payments });
    } catch (error) {
        res.status(500).json({ message: "Error fetching payments" });
    }
};
export const changePaymentStatus = async (req: any, res: any) => {
  try {
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
      return res.status(404).json({ message: "لا توجد مدفوعات لهذا العقد" });
    }
    res.status(200).json(payments);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
