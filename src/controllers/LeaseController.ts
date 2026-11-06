import * as ApplicationModule from "../models/Application.model.js";
import Lease from "../models/Leases.model.js";
import AppError from "../utils/appError.js";
const Application =
  (ApplicationModule as any).default ??
  (ApplicationModule as any).Application ??
  ApplicationModule;

export const createLease = async (req: any, res: any, next: any) => {
  // إذا لم يرسل المستخدم projectId في الـ body، نأخذه من الرابط

  const application = await Application.findById(req.params.applicationId);
  if (!application) {
    return next(new AppError("Application not found", 404));
  }

 const statusCheck = application.status;

  if (statusCheck !== "approved") {
    return next(
      new AppError("A lease cannot be created before the application is approved.", 400),
    );
  }
  if (application.lease != null) {
    return next(new AppError("A lease has already been created for this application.", 400));
  }
  if (!req.body.rent) req.body.rent = application.pricePerMonth;
  if (!req.body.deposit) req.body.deposit = application.securityDeposit;
  if (!req.body.property) req.body.property = application.property;
  if (!req.body.tenant) req.body.tenant = application.tenant;
  const propertyId = req.body.property || application.property;
  console.log(propertyId);
  const existingActiveLease = await Lease.findOne({
    property: propertyId,
    endDate: { $gte: new Date() },
  });
  console.log(existingActiveLease);
  if (existingActiveLease) {
    return next(new AppError("this property have an active lease", 400));
  }
  const newLease = await Lease.create(req.body);
  application.lease = newLease._id;
  await application.save();
  res.status(201).json(newLease);
};

export const getTenantLeases = async (req: any, res: any) => {
    // مثال لتحديث حقل الصورة في الدالة
    const leases = await Lease.find({ tenant: req.user._id })
      .populate({
        path: "property",
        populate: {
          path: "locationId",
        },
        //select: "name description pricePerMonth _id  ",
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
};

export const getPropertyLeases = async (req: any, res: any, next: any) => {
    // مثال لتحديث حقل الصورة في الدالة
    const leases = await Lease.find({
      property: req.params.propertyId,
    })
      .populate({
        path: "property",
        populate: {
          path: "locationId",
        },
        //select: "name description pricePerMonth _id  ",
      })
      .populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ",
      });
    if (!leases) {
      return next(new AppError("lease not found", 400));
    }
    res.status(200).json({
      status: "success",
      results: leases.length,
      data: leases,
    });
};

export const getLeasesPropertyByUser = async (req: any, res: any, next: any) => {
    const leases = await Lease.find({
      property: req.params.propertyId,
      tenant: req.user._id,
    })
      .populate({
        path: "property",
        populate: {
          path: "locationId",
        },
      })
      .populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ",
      });
    if (!leases) {
     return next(new AppError("lease not found", 400));
    }
    res.status(200).json({
      status: "success",
      results: leases.length,
      data: leases,
    });
};
