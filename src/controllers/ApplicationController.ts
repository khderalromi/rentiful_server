import * as ApplicationModule from "../models/Application.model.js";

const Application =
  (ApplicationModule as any).default ??
  (ApplicationModule as any).Application ??
  ApplicationModule;

export const createApplication = async (req: any, res: any) => {
  // إذا لم يرسل المستخدم projectId في الـ body، نأخذه من الرابط
  try {
    if (!req.body.property) req.body.property = req.params.propertyId;

    const newApplication = await Application.create({
      tenant: req.user._id,
      message: req.body.message,
      property: req.body.property,
    })
    res.status(201).json(newApplication);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
  // ... بقية الكود
};

export const getTenantApplications = async (req: any, res: any) => {
  try {
    // مثال لتحديث حقل الصورة في الدالة
    const applications = await Application.find({ tenant: req.user._id }).populate({
    path: "tenant",
    select: "name email phoneNumber congitoId _id ", // نحن لا نحتاج إلى جميع حقول الطبيب، فقط اسمه
  }).populate({
    path:"property",
    select:"name description pricePerMonth _id  ", // نحن لا نحتاج إلى جميع حقول العقار، فقط بعضها
  });
    res.status(200).json({
      status: "success",
      results: applications.length,
      data: { applications },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getPropertyApplications = async (req: any, res: any) => {
  try {
    // مثال لتحديث حقل الصورة في الدالة
    const applications = await Application.find({
      property: req.params.propertyId,
    }).populate({
      path:"property",
      select:"name description pricePerMonth _id  ",
    }).populate({
      path: "tenant",
      select: "name email phoneNumber congitoId _id ",
    });
    if (!applications) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }
    res.status(200).json({
      status: "success",
      results: applications.length,
      data: { applications },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const changeStatus = async (req: any, res: any) => {
  try {
    // مثال لتحديث حقل الصورة في الدالة
    const newApplication = await Application.findByIdAndUpdate(
      { _id: req.params.applicationId },
      { status: req.body.status },
      { new: true },
    ).populate({
      path:"property",
      select:"name description pricePerMonth _id  ",
    }).populate({
      path: "tenant",
      select: "name email phoneNumber congitoId _id ",
    });

    if (!newApplication) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }
    res.status(200).json({
      status: "success",
      data: { newApplication },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};



// 3. إلغاء الحجز (تغيير الحالة وليس الحذف)
export const cancelApplication = async (req:any, res:any) => {
    try {
        // نبحث عن الحجز ونتأكد أنه يخص المريض الحالي لضمان الأمان
        const application = await Application.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!application) {
            return res.status(404).json({ message: 'الحجز غير موجود أو لا تملك صلاحية إلغائه.' });
        }

        // تغيير الحالة إلى cancelled
        application.status = 'cancelled';
        await application.save();

        res.status(200).json({
            status: 'success',
            message: 'تم إلغاء الطلب بنجاح.',
            data: { application }
        });
    } catch (err:any) {
        res.status(400).json({ message: err.message });
    }
};