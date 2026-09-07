import * as TenantModule from "../models/Tenant.model.js";

const Tenant =
  (TenantModule as any).default ?? (TenantModule as any).Tenant ?? TenantModule;

export const addToFavourite = async (req: any, res: any) => {
  // إذا لم يرسل المستخدم projectId في الـ body، نأخذه من الرابط
  try {
    //if (!req.body.propertyId) req.body.propertyId = req.params.propertyId;
    //console.log(req.params.propertyId);

    let tenant: any = await Tenant.findOneAndUpdate(
      { tenant: req.user._id },
      { $addToSet: { favourites: req.params.propertyId } },
      { new: true },
    )
      .populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ", // نحن لا نحتاج إلى جميع حقول الطبيب، فقط اسمه
      })
      .populate({
        path: "favourites",
        select: "name description pricePerMonth _id  ", // نحن لا نحتاج إلى جميع حقول العقار، فقط بعضها
      });

    if (!tenant) {
      tenant = await Tenant.create({
        favourites: req.params.propertyId,
        tenant: req.user._id,
      })
        .populate({
          path: "tenant",
          select: "name email phoneNumber congitoId _id ", // نحن لا نحتاج إلى جميع حقول الطبيب، فقط اسمه
        })
        .populate({
          path: "favourites",
          select: "name description pricePerMonth _id  ", // نحن لا نحتاج إلى جميع حقول العقار، فقط بعضها
        });
    }

    /*let tenant: any = await Tenant.findById(req.user._id);
    if(tenant){
        if(!tenant.favourites.includes(req.params.propertyId)){
        const newTenantFavourite=tenant.favourites.push(req.params.propertyId)

        return res.status(201).json(newTenantFavourite);
        }
    }
    const newTenantFavourite = await Tenant.create({
                                                favourites:req.params.propertyId,
                                                tenant:req.user._id});*/
    return res.status(201).json(tenant);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
  // ... بقية الكود
};

export const getAllTenantFavourites = async (req: any, res: any) => {
  try {
    // مثال لتحديث حقل الصورة في الدالة

    const favourites = await Tenant.findOne({ tenant: req.user._id })
      .populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ", // نحن لا نحتاج إلى جميع حقول الطبيب، فقط اسمه
      })
      .populate({
        path: "favourites",
        select: "name description pricePerMonth _id  ", // نحن لا نحتاج إلى جميع حقول العقار، فقط بعضها
      });
    res.status(200).json({
      status: "success",
      results: favourites.length,
      data: { favourites },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deletePropertyFromFav = async (req: any, res: any) => {
  try {
    const updatedFavorites = await Tenant.findOneAndUpdate(
      { tenant: req.user._id },
      { $pull: { favourites: req.params.propertyId } },
      { new: true },
    ).populate({
        path: "tenant",
        select: "name email phoneNumber congitoId _id ", // نحن لا نحتاج إلى جميع حقول الطبيب، فقط اسمه
      })
      .populate({
        path: "favourites",
        select: "name description pricePerMonth _id  ", // نحن لا نحتاج إلى جميع حقول العقار، فقط بعضها
      });
    if (!updatedFavorites) {
      // 404 تعني أن العيادة غير موجودة أصلاً لنحذفها
      return res.status(404).json({ message: "العقار غير موجود" });
    }

    // 200 تعني تمت العملية بنجاح
    res.status(200).json({ message: "تم حذف العقار بنجاح", updatedFavorites });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
