import * as ReviewsModule from '../models/reviews.model.js';

const Review = (ReviewsModule as any).default ?? (ReviewsModule as any).Review ?? ReviewsModule;

export const createReview = async (req:any, res:any) => {
    if (!req.body.property) req.body.property = req.params.propertyId;
    
    const newReview = await Review.create(req.body);
    res.status(201).json(newReview);
   
};
