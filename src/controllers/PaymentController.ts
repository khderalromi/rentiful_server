import * as PaymentModule from "../models/Payment.model.js";
import * as LeaseModule from "../models/Leases.model.js";

const Payment =
  (PaymentModule as any).default ??
  (PaymentModule as any).Payment ??
  PaymentModule;
const Lease =
  (LeaseModule as any).default ?? (LeaseModule as any).Lease ?? LeaseModule;

export const createPayment = async (req: any, res: any) => {
  try {
    if (!req.body.leaseId) req.body.leaseId = req.params.leaseId;
    const lease = await Lease.findById(req.body.leaseId)
      .populate({
        path: "property",
        select: "name description pricePerMonth _id  ",
      })
      .populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ",
      });

    if (!lease) {
      return res.status(404).json({ message: "العقد غير موجود" });
    }
    if (lease && lease.endDate < new Date()) {
      const newPayment = await Payment.create({...req.body,lease: req.body.leaseId})
      res.status(201).json(newPayment);
    }
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
