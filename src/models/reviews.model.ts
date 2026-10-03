import mongoose from "mongoose";
import Property from "./Property.model.js";
const reviewsSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.ObjectId,
      ref: "Property",
      required: [true, "كل مراجعة لها عقار مرتبط بها"],
    },
    reviews: {
      type: String,
    },
    rating: {
      type: Number,
      required: [true, " ادخل التقييم كرقم من 5"],
    },
  },
  {
    timestamps: true,
  },
);

reviewsSchema.statics.calcAverageRatings = async function (propertyId: string) {
  const stats = await this.aggregate([
    {
      $match: { property: propertyId },
    },
    {
      $group: {
        _id: "$property",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Property.findByIdAndUpdate(propertyId, {
      Averageratings: stats[0].avgRating,
      numberOfReviews: stats[0].nRating,
    });
  } else {
    await Property.findByIdAndUpdate(propertyId, {
      Averageratings: 4.5,
    });
  }
};

reviewsSchema.post("save", function (this: any) {
  console.log(this.property);
  this.constructor.calcAverageRatings(this.property);
});
reviewsSchema.pre(/^findOneAnd/, async function (this: any, next: any) {
  this.r = await this.findOne();
  next();
});

reviewsSchema.post(/^findOneAnd/, async function (this: any) {
  await this.r.constructor.calcAverageRatings(this.r.property);
});

const Review = mongoose.model("Review", reviewsSchema);
export default Review;
