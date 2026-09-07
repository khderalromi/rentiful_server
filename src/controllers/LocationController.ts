import * as LocationModel from '../models/Location.model.js';

const Location = (LocationModel as any).default ?? (LocationModel as any).Review ?? LocationModel;


export const createLocation = async (req:any, res:any) => {
    try {
        const newLocation = await Location.create(req.body);
        res.status(201).json(newLocation);
    } catch (err:any) {
        res.status(400).json({ message: err.message });
    }
};


export const updateLocation = async (req:any, res:any) => {
    try {
        const updatedLocation= await Location.findByIdAndUpdate(req.params.locationId, req.body,
            { new: true, runValidators: true }
        ); // سنأخذ البيانات من الطلب القادم
        if (!updatedLocation) {
            res.status(404).json({ message: "not found" })
        }

        res.status(200).json(updatedLocation);
    } catch (err:any) {
        res.status(400).json({ message: err.message });
    }
};
