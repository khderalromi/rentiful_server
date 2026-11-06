import * as LocationModel from '../models/Location.model.js';
import AppError from '../utils/appError.js';

const Location = (LocationModel as any).default ?? (LocationModel as any).Review ?? LocationModel;


export const createLocation = async (req:any, res:any) => {
    
    const newLocation = await Location.create(req.body);
    res.status(201).json(newLocation);
};


export const updateLocation = async (req:any, res:any, next: any) => {
        const updatedLocation= await Location.findByIdAndUpdate(req.params.locationId, req.body,
            { new: true, runValidators: true }
        );
        if (!updatedLocation) {
            return next(new AppError("location not found", 404));
        }

        res.status(200).json(updatedLocation);
};
