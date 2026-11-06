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
import AppError from "../utils/appError.js";

const multerStorage = multer.memoryStorage();

const multerFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true); 
  } else {
    cb(new Error("Invalid file type. Please upload images only."), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadPropertyrPhoto = upload.array("photos", 10);;

export const resizePropertyPhoto = async (req: any, res: any, next: any) => {
    if (!req.files || req.files.length === 0) return next();
    req.body.photoUrls = [];

   for (const file of req.files) {
      const filename = `property-${req.user ? req.user.id : "admin"}-${Date.now()}-${Math.round(Math.random() * 1000)}.jpeg`;

      await sharp(file.buffer)
        .resize(800, 800)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/property/${filename}`);
    next();
   }

};

export const deleteProperty = async (req: any, res: any, next: any) => {
    const deletedProperty = await Property.findByIdAndDelete(req.params.id);
    if (!deletedProperty) {
      return next(new AppError("property not found", 404));;
    }

    res.status(200).json({ message: "property deleted ..", deletedProperty });
};

export const createProperty = async (req: any, res: any, next: any) => {
    const parseField = (field: any) => {
      if (typeof field === "string") {
        try {
          console.log(field)
          return JSON.parse(field); 
        } catch (e) {
          return [field]; 
        }
      }
      return field;
    };
    req.body.coordinates = parseField(req.body.coordinates);
    //req.body.amenities = parseField(req.body.amenities);
    //req.body.highLights = parseField(req.body.highLights);
    console.log(req.body.coordinates)
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
    if(!req.body.manager) req.body.manager = req.user._id;
    const newProperty = await Property.create({
      ...req.body,
      locationId: createdLocation?._id,
    });

    res.status(201).json(newProperty);
  
};

export const updateProperty = async (req: any, res: any, next: any) => {
    let updatedProperty: any = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedProperty) {
      return next (new AppError("Property not found.", 404));
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
};

export const findPropertyfilter = async (req: any, res: any) => {
    let queryObj = { ...req.query };
    const excludeFields = ["sort", "page", "limit", "fields", "locationId", "latlng", "distance", "unit", "city", "location"];
    excludeFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
    let finalQuery = JSON.parse(queryStr);

    Object.keys(finalQuery).forEach((key) => {
      if (key.includes("[") && key.includes("]")) {
        const [field, operatorRaw] = key.split("[");
        const operator = `${(operatorRaw ?? "").replace("]", "")}`;
        if (!field) return;

        if (!finalQuery[field]) finalQuery[field] = {};

        finalQuery[field][operator] = Number(finalQuery[key]);
        delete finalQuery[key];
      }
    });
let locationIds : string[] = [];
if (req.query.latlng && req.query.distance) {
  const [lat, lng] = req.query.latlng.split(",");
  const radius = req.query.unit === "mi" ? Number(req.query.distance) / 3963.2 : Number(req.query.distance) / 6378.1;
  
  const nearbyLocations = await Location.find({
    location: { $geoWithin: { $centerSphere: [[Number(lng), Number(lat)], radius] } }
  });
  
  locationIds = nearbyLocations.map((loc: any) => loc._id.toString());
  finalQuery.locationId = { $in: locationIds };
} 
else if (req.query.city || req.query.location) {
  const cityName = req.query.city || req.query.location;
  if (cityName !== "any" && cityName.trim() !== "") {
    const matchingLocations = await Location.find({
      city: { $regex: new RegExp(cityName, "i") }
    });
    
    locationIds = matchingLocations.map((loc: any) => loc._id.toString());
    finalQuery.locationId = { $in: locationIds };
  }
}

delete finalQuery.city;
delete finalQuery.location;
    let propertyQuery: any = Property.find(finalQuery);

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      propertyQuery = propertyQuery.sort(sortBy);
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      propertyQuery = propertyQuery.select(fields);
    } else {
      propertyQuery = propertyQuery.select("-__v");
    }

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    propertyQuery = propertyQuery.skip(skip).limit(limit);

    const properties = await propertyQuery
      .populate({
        path: "manager",
        select: "name",
      })
      .populate({
        path: "locationId",
        select: "city state postalCode location",
      })
      .populate({
        path: "reviews",
        select: "reviews",
      });

    res.status(200).json({
      status: "success",
      results: properties.length, 
      data: properties,
    });
  
};


//get property by id
export const getProperty = async (req: any, res: any, next: any) => {

  const property = await Property.findById(req.params.id)
    .populate({
      path: "manager",
      select: "name",
    })
    .populate({
      path: "locationId",
      select: "city state postalCode location",
    })
    .populate({
      path: "reviews",
      select: "reviews",
    });
    if(!property) {
      return next(new AppError("property not found", 404));
    }
  console.log(property);
  res.status(200).json({ status: "success", data: property });
};


//Mnaager properties
export const getManagerProperties = async (req: any, res: any) => {

  const property = await Property.find({manager:req.user._id})
    .populate({
      path: "manager",
      
    })
    .populate({
      path: "locationId",
      
    })
    .populate({
      path: "reviews",
      select: "reviews",
    });

  console.log(property);
  res.status(200).json({ status: "success", data: property });
};

//All properties
export const getAllProperties = async (req: any, res: any) => {
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
 
};

export const getPropertyReviews = async (req: any, res: any) => {
    const propId: string = req.params.propertyId || req.params.id;

    let filter = {};
    if (propId) filter = { property: propId };
    console.log(filter)
    const reviews = await Review.find({ property: req.params.propertyId }).populate({
        path:"property",
        select:"name description pricePerMonth _id  ", 
    })
    

    res.status(200).json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
      },
    });
 
};

export const getPropertiesWithinRadius = async (req: any, res: any, next: any) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng) {
     return next(new AppError("Please provide latitude and longitude in the format lat,lng", 400))
    }

    const radius =
      unit === "mi" ? Number(distance) / 3963.2 : Number(distance) / 6378.1;

    const nearbyLocations = await Location.find({
      location: {
        $geoWithin: {
          $centerSphere: [[Number(lng), Number(lat)], radius],
        },
      },
    });

    const locationIds = nearbyLocations.map((loc: { _id: any }) => loc._id);

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
      }); 

    res.status(200).json({
      status: "success",
      results: properties.length,
      data: properties,
    });
};
