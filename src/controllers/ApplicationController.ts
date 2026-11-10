import * as ApplicationModule from "../models/Application.model.js";

const Application =
  (ApplicationModule as any).default ??
  (ApplicationModule as any).Application ??
  ApplicationModule;

import Lease, * as LeaseModule from "../models/Leases.model.js";
import Property from "../models/Property.model.js";
import AppError from "../utils/appError.js";

const Leases =
  (LeaseModule as any).default ?? (LeaseModule as any).Leases ?? LeaseModule;

export const createApplication = async (req: any, res: any) => {
  if (!req.body.property) req.body.property = req.params.propertyId;

  const newApplication = await Application.create({
    tenant: req.user._id,
    message: req.body.message,
    property: req.body.propertyId,
  });
  res.status(201).json(newApplication);
};

export const getTenantApplications = async (req: any, res: any) => {
  const applications = await Application.find({ tenant: req.user._id })
    .populate({
      path: "tenant",
      select: "name email phoneNumber congitoId _id ",
    })
    .populate({
      path: "property",
      select: "name description pricePerMonth _id  ",
    });
  res.status(200).json({
    status: "success",
    results: applications.length,
    data: { applications },
  });
};

export const getPropertyApplications = async (
  req: any,
  res: any,
  next: any,
) => {
  const applications = await Application.find({
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
  if (!applications) {
    return next(new AppError("application not found", 404));
  }
  res.status(200).json({
    status: "success",
    results: applications.length,
    data: { applications },
  });
};

export const getApplications = async (req: any, res: any, next: any) => {
  const userType = req.user.role;
  let applications;
  // مثال لتحديث حقل الصورة في الدالة
  if (userType === "Manager") {
    const managerProperties = await Property.find({ manager: req.user._id });
    const propertyIds = managerProperties.map((prop) => prop._id);
    applications = await Application.find({
      property: { $in: propertyIds },
    })
      .populate({
        path: "property",
        populate: {
          path: "locationId",
        },
      })
      .populate({
        path: "tenant",
        select: "name email phoneNumber  _id ",
      });
  } else {
    applications = await Application.find({ tenant: req.user._id })
      .populate({
        path: "property",
        populate: {
          path: "locationId",
        },
      })
      .populate({
        path: "tenant",
        select: "name email phoneNumber  _id ",
      });
  }
  if (!applications) {
    return next(new AppError("applications not found", 404));
  }
  res.status(200).json({
    status: "success",
    results: applications.length,
    data: { applications },
  });
};

export const changeStatus = async (req: any, res: any, next: any) => {
  const application = await Application.findById(req.params.applicationId);
  if (!application) {
    return next(new AppError("applications not found", 404));
  }
  if (req.body.status === "approved") {
    const existingActiveLease = await Leases.findOne({
      property: application.property,
      endDate: { $gte: new Date() },
    });
    if (existingActiveLease) {
      return next(new AppError("this property have an active lease", 404));
    }
  }
  const newApplication = await Application.findByIdAndUpdate(
    { _id: req.params.applicationId },
    { status: req.body.status },
    { new: true },
  )
    .populate({
      path: "property",
      select: "name description securityDeposit pricePerMonth _id  ",
    })
    .populate({
      path: "tenant",
      select: "name email phoneNumber congitoId _id ",
    });

  if (!newApplication) {
    return next(new AppError("application not found", 400));
  }
  if (newApplication.status === "approved") {
    if (newApplication.lease != null) {
      return next(
        new AppError(
          "A lease has already been created for this application.",
          400,
        ),
      );
    }
    console.log("✅ newApplication:", newApplication);
    if (!req.body.rent) req.body.rent = newApplication.property.pricePerMonth;
    if (!req.body.deposit) req.body.deposit = newApplication.property.securityDeposit;
    if (!req.body.property) req.body.property = newApplication.property._id;
    if (!req.body.tenant) req.body.tenant = newApplication.tenant._id;
    const propertyId = req.body.property || newApplication.property;
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
    newApplication.lease = newLease._id;
    await newApplication.save();
    return res.status(201).json({
      status: "success",
      data: {
        application: newApplication,
        lease: newLease,
      },
    });
  }
  res.status(200).json({
    status: "success",
    data: { newApplication },
  });
};

export const cancelApplication = async (req: any, res: any, next: any) => {
  const application = await Application.findByIdAndDelete(
    { _id: req.params.applicationId },
    { user: req.user._id },
    { new: true },
  );

  if (!application) {
    return next(
      new AppError("application not found or you can't delete it", 404),
    );
  }
  res.status(200).json({
    status: "success",
    message: "application cancelled successfully",
    data: { application },
  });
};
