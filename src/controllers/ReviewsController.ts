import * as ReviewsModule from '../models/reviews.model.js';

const Review = (ReviewsModule as any).default ?? (ReviewsModule as any).Review ?? ReviewsModule;

export const createReview = async (req:any, res:any) => {
    // إذا لم يرسل المستخدم projectId في الـ body، نأخذه من الرابط
    try{
    if (!req.body.property) req.body.property = req.params.propertyId;
    
    const newReview = await Review.create(req.body);
    res.status(201).json(newReview);
    } catch (err:any) {
        res.status(400).json({ message: err.message });
    }
    // ... بقية الكود
};
