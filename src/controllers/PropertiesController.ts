import mongoose from "mongoose";
import * as PropertyModule from "../models/Property.model.js";
import * as ReviewsModule from "../models/reviews.model.js";
import * as LocationModule from "../models/Location.model.js";

const Property =
  (PropertyModule as any).default ??
  (PropertyModule as any).Property ??
  PropertyModule;
const Review =
  (ReviewsModule as any).default ??
  (ReviewsModule as any).Review ??
  ReviewsModule;
const Location =
  (LocationModule as any).default ??
  (LocationModule as any).Review ??
  LocationModule;

import multer from "multer";
import sharp from "sharp";

// 1. تحديد التخزين المؤقت في الذاكرة (Memory Storage)
const multerStorage = multer.memoryStorage();

// 2. فلتر الأمان: التأكد من أن الملف المرفوع هو صورة فقط وليس ملف خبيث (exe, pdf...)
const multerFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true); // الملف سليم، مرره
  } else {
    cb(new Error("الملف المرفوع ليس صورة! يرجى رفع صور فقط."), false);
  }
};

// 3. تجهيز الميدلوير
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// متاح للاستخدام في ملف المسارات (حقل واحد باسم photo)
export const uploadPropertyrPhoto = upload.single("photo");

export const resizePropertyPhoto = async (req: any, res: any, next: any) => {
  try {
    // إذا لم يقم المستخدم برفع صورة جديدة، ننتقل للدالة التالية فوراً
    if (!req.file) return next();

    // بناء اسم فريد للصورة لعدم تكرار الأسماء (مثال: doctor-6a0080-168482.jpeg)
    req.file.filename = `property-${req.user ? req.user.id : "admin"}-${Date.now()}.jpeg`;

    // 💡 السحر البرمجي باستخدام مكتبة Sharp:
    await sharp(req.file.buffer)
      .resize(500, 500) // تغيير الحجم لأبعاد مربعة مثالية للبروفايل
      .toFormat("jpeg") // توحيد الصيغة لـ jpeg لتقليل الحجم
      .jpeg({ quality: 90 }) // ضغط الجودة لـ 90% (توفر 70% من المساحة بنفس النقاء)
      .toFile(`public/img/property/${req.file.filename}`); // الحفظ النهائي في مجلد المشروع

    next();
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteProperty = async (req: any, res: any) => {
  try {
    const deletedProperty = await Property.findByIdAndDelete(req.params.id);
    if (!deletedProperty) {
      // 404 تعني أن العيادة غير موجودة أصلاً لنحذفها
      return res.status(404).json({ message: "العقار غير موجود" });
    }

    // 200 تعني تمت العملية بنجاح
    res.status(200).json({ message: "تم حذف العقار بنجاح", deletedProperty });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createProperty = async (req: any, res: any) => {
  try {
    // 2. إذا لم يكن موجوداً، نقوم بإنشائه تلقائياً في الخلفية
    const createdLocation: any = await Location.create({
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      postalCode: req.body.postalCode,
      location: {
        type: "Point",
        coordinates: req.body.coordinates,
      },
    });
    if(!req.body.manager) req.body.manager = req.user.id;
    const newProperty = await Property.create({
      ...req.body,
      locationId: createdLocation?._id,
    });

    res.status(201).json(newProperty);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updateProperty = async (req: any, res: any) => {
  try {
    let updatedProperty: any = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedProperty) {
      res.status(404).json({ message: "not found" });
    }

    if (
      req.body.address ||
      req.body.city ||
      req.body.state ||
      req.body.country ||
      req.body.postalCode ||
      req.body.location
    ) {
      await Location.findByIdAndUpdate(
        updatedProperty.locationId._id,
        req.body,
        { new: true, runValidators: true },
      );
    }

    const finalProperty = await Property.findById(req.params.id)
      .populate({
        path: "manager",
        select: "name",
      })
      .populate({
        path: "locationId",
        select: "city state postalCode coordinates",
      })
      .populate({
        path: "reviews",
        select: "reviews",
      });
    return res.status(200).json(finalProperty);
    // سنأخذ البيانات من الطلب القادم
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const findPropertyfilter = async (req: any, res: any) => {
  try {
    // 1. عزل شروط البحث عن أوامر التحكم (sort, limit...)
    let queryObj = { ...req.query };
    const excludeFields = ["sort", "page", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    // 2. معالجة العمليات الحسابية (gt, gte...) وتحويلها لصيغة MongoDB
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
    let finalQuery = JSON.parse(queryStr);

    // 3. معالجة الأقواس المربعة (مهمة جداً لضمان نظافة البحث)
    //العمليات التي تحوي فقط على اقواس مثا price [gte]=200
    Object.keys(finalQuery).forEach((key) => {
      if (key.includes("[") && key.includes("]")) {
        //price[gte]  تصبح price   gte]
        const [field, operatorRaw] = key.split("[");
        //ازالة قوس النهاية من gte]
        const operator = `${(operatorRaw ?? "").replace("]", "")}`;
        if (!field) return;

        //مهم لانشاء كائن فارغ للحقل المقصود
        if (!finalQuery[field]) finalQuery[field] = {};

        finalQuery[field][operator] = Number(finalQuery[key]);
        delete finalQuery[key];
      }
    });

    // 4. بناء الاستعلام (هنا تبدأ عملية الـ Chaining)
    let propertyQuery: any = Property.find(finalQuery);

    // 5. الترتيب (Sorting)
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      propertyQuery = propertyQuery.sort(sortBy);
    }

    // 6. تحديد الحقول (Field Limiting)
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      propertyQuery = propertyQuery.select(fields);
    } else {
      propertyQuery = propertyQuery.select("-__v");
    }

    // 7. التقسيم والـ Limit (هذا هو السطر الذي يفشل عندك حالياً)
    // تأكدنا هنا من تحويل النص إلى رقم (مثلاً '5' تصبح 5)
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    propertyQuery = propertyQuery.skip(skip).limit(limit);

    // 8. تنفيذ الاستعلام (يجب أن يكون الـ await في آخر خطوة)
    const properties = await propertyQuery
      .populate({
        path: "manager",
        select: "name",
      })
      .populate({
        path: "locationId",
        select: "city state postalCode coordinates",
      })
      .populate({
        path: "reviews",
        select: "reviews",
      });

    // إرسال الاستجابة
    res.status(200).json({
      status: "success",
      results: properties.length, // يجب أن يطبع 5 الآن
      data: properties,
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

//تطبيق populate
export const getProperty = async (req: any, res: any) => {
  // جلب المشروع و "ملء" بيانات المهندس تلقائياً
  // "doctors" هو اسم الحقل الذي يشير إلى الـ ObjectId في الـ Schema
  //const clinic = await Clinic.findById(:any.params.id).populate({path: 'team',select: 'name specialist budget '});
  if (req.file) req.body.photo = req.file.filename;
  const property = await Property.findById(req.params.id)
    .populate({
      path: "manager",
      select: "name",
    })
    .populate({
      path: "locationId",
      select: "city state postalCode coordinates",
    })
    .populate({
      path: "reviews",
      select: "reviews",
    });

  console.log(property);
  res.status(200).json({ status: "success", data: { property } });
};

export const getAllProperties = async (req: any, res: any) => {
  try {
    // مثال لتحديث حقل الصورة في الدالة
    if (req.file) req.body.photo = req.file.filename;
    const properties = await Property.find()
      .populate({
        path: "manager",
        select: "name",
      })
      .populate({
        path: "locationId",
        select: "city state postalCode coordinates",
      })
      .populate({
        path: "reviews",
        select: "reviews",
      });

    res.status(200).json({
      status: "success",
      results: properties.length,
      data: { properties },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getPropertyReviews = async (req: any, res: any) => {
  try {
    // 1. تحديد الفلتر (إذا كان هناك ID في الرابط نستخدمه، وإلا الفلتر فارغ)
    const propId: string = req.params.propertyId || req.params.id;

    let filter = {};
    if (propId) filter = { property: propId };
    // 2. تنفيذ الاستعلام
    console.log(filter)
    const reviews = await Review.find({ property: req.params.propertyId }).populate({
        path:"property",
        select:"name description pricePerMonth _id  ", // نحن لا نحتاج إلى جميع حقول العقار، فقط بعضها
    })
    

    res.status(200).json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getPropertiesWithinRadius = async (req: any, res: any) => {
  try {
    // 1. استخراج المتغيرات من الرابط
    // مثال للرابط: /properties/radius/5/center/33.5138,36.2765/unit/km
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng) {
      return res.status(400).json({
        message: "يرجى توفير خط الطول ودائرة العرض بصيغة lat,lng",
      });
    }

    // 2. تحويل المسافة إلى راديان (التي يفهمها محرك MongoDB)
    // قسمة المسافة على نصف قطر الأرض (3963.2 ميل أو 6378.1 كم)
    const radius =
      unit === "mi" ? Number(distance) / 3963.2 : Number(distance) / 6378.1;

    // 3. البحث في جدول الـ Locations عن المواقع التي تقع ضمن هذه الدائرة
    const nearbyLocations = await Location.find({
      location: {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radius],
        },
      },
    });

    // 4. استخراج معرّفات المواقع القريبة
    const locationIds = nearbyLocations.map((loc: { _id: any }) => loc._id);

    // 5. البحث في جدول العقارات عن العقارات التي تمتلك هذه المواقع
    const properties = await Property.find({ locationId: { $in: locationIds } })
      .populate("locationId")
      .populate({
        path: "manager",
        select: "name",
      })
      .populate({
        path: "locationId",
        select: "city state postalCode coordinates",
      })
      .populate({
        path: "reviews",
        select: "reviews",
      }); // لجلب تفاصيل الموقع داخل كل عقار

    res.status(200).json({
      status: "success",
      results: properties.length,
      data: properties,
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
