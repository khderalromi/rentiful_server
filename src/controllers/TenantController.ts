import * as TenantModule from "../models/Tenant.model.js";
import AppError from "../utils/appError.js";

const Tenant =
  (TenantModule as any).default ?? (TenantModule as any).Tenant ?? TenantModule;

export const addToFavourite = async (req: any, res: any) => {

    let tenant: any = await Tenant.findOneAndUpdate(
      { tenant: req.user._id },
      { $addToSet: { favourites: req.params.propertyId } },
      { new: true },
    )
      .populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ",
      })
      .populate({
        path: "favourites",
        select: "name description pricePerMonth _id  ", 
      });

    if (!tenant) {
      tenant = await Tenant.create({
        favourites: req.params.propertyId,
        tenant: req.user._id,
      })
        .populate({
          path: "tenant",
          select: "name email phoneNumber congitoId _id ",
        })
        .populate({
          path: "favourites",
          select: "name description pricePerMonth _id  ",
        });
    }

    return res.status(201).json(tenant);
};

export const getAllTenantFavourites = async (req: any, res: any) => {
    const favourites = await Tenant.findOne({ tenant: req.user._id })
      .populate({
        path: "tenant",
        select: "name email phoneNumber _id ", 
      })
      .populate({
        path: "favourites",
        select: "name description pricePerMonth _id  ",
      });
    res.status(200).json({
      status: "success",
      results: favourites.length,
      data: { favourites },
    });

};

export const deletePropertyFromFav = async (req: any, res: any, next:any) => {
    const updatedFavorites = await Tenant.findOneAndUpdate(
      { tenant: req.user._id },
      { $pull: { favourites: req.params.propertyId } },
      { new: true },
    ).populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ", 
      })
      .populate({
        path: "favourites",
        select: "name description pricePerMonth _id  ",
      });
    if (!updatedFavorites) {
      return next(new AppError("favourite not found", 404));
    }

    res.status(200).json({ message: "property deletted successful", updatedFavorites });
  
};
