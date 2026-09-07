import * as ApplicationModule from "../models/Application.model.js";
import Lease from "../models/Leases.model.js";
import AppError from "../utils/appError.js";
const Application =
  (ApplicationModule as any).default ??
  (ApplicationModule as any).Application ??
  ApplicationModule;

export const createLease = async (req: any, res: any, next: any) => {
  // إذا لم يرسل المستخدم projectId في الـ body، نأخذه من الرابط
  try {
    const application = await Application.findById(req.params.applicationId);
    const statusCheck = application.status;
    console.log(statusCheck);
    if (statusCheck !== "approved") {
      return next(
        new AppError("لا يمكن إنشاء عقد إلا بعد الموافقة على الطلب", 400),
      );
    }
    if (application.lease !== null) {
      return next(new AppError("تم إنشاء عقد مسبقًا لهذا الطلب", 400));
    }
    if (!req.body.rent) req.body.rent = application.pricePerMonth;
    if (!req.body.deposit) req.body.deposit = application.securityDeposit;
    if (!req.body.property) req.body.property = application.property;
    if (!req.body.tenant) req.body.tenant = application.tenant;

    const newLease = await Lease.create(req.body);
    application.lease = newLease._id;
    await application.save();
    res.status(201).json(newLease);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
  // ... بقية الكود
};

export const getTenantLeases = async (req: any, res: any) => {
  try {
    // مثال لتحديث حقل الصورة في الدالة
    const leases = await Lease.find({ tenant: req.user._id })
      .populate({
        path: "property",
        select: "name description pricePerMonth _id  ",
      })
      .populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ",
      });
    console.log(req.user._id);
    res.status(200).json({
      status: "success",
      results: leases.length,
      data: { leases },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getPropertyLeases = async (req: any, res: any) => {
  try {
    // مثال لتحديث حقل الصورة في الدالة
    const leases = await Lease.find({
      property: req.params.propertyId,
    })
      .populate({
        path: "property",
        select: "name description pricePerMonth _id  ",
      })
      .populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ",
      });
    if (!leases) {
      return res.status(404).json({ message: "العقد غير موجود" });
    }
    res.status(200).json({
      status: "success",
      results: leases.length,
      data: { leases },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
