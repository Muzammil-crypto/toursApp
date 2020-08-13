const express = require('express');

const reviewRouter = express.Router({
  mergeParams: true
});

const {
  getAllReviews,
  createReview,
  getReview,
  deleteReview,
  updateReview,
  setUserTourIds
} = require('../controllers/reviewController');

const { protect, restrictTo } = require('../controllers/authController');

reviewRouter.use(protect);
reviewRouter
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setUserTourIds, createReview);

reviewRouter
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = reviewRouter;
