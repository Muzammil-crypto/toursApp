const Review = require('../models/reviewModel');
// const AsyncCatch = require('../utils/AsyncCatch');
const factoryHandler = require('./factoryHandler');

exports.setUserTourIds = (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  if (!req.body.user) {
    req.body.user = req.user._id;
  }
  next();
};
// exports.getAllReviews = AsyncCatch(async (req, res, next) => {
//   const filter = {};
//   if (req.params.tourId) {
//     filter.tour = req.params.tourId;
//   }
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews
//     }
//   });
// });

exports.getReview = factoryHandler.getOne(Review);
exports.getAllReviews = factoryHandler.getAll(Review);
exports.createReview = factoryHandler.createOne(Review);
exports.updateReview = factoryHandler.updateOne(Review);
exports.deleteReview = factoryHandler.deleteOne(Review);
// exports.createReview = AsyncCatch(async (req, res, next) => {

//   const review = await Review.create(req.body);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review
//     }
//   });
// });
