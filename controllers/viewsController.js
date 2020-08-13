const Tour = require('../models/tourModel');
const AsyncCatch = require('../utils/AsyncCatch');
const AppError = require('../utils/appError');

exports.getOverview = AsyncCatch(async (req, res, next) => {
  //Get tour data from collection
  const tours = await Tour.find();
  //Build template
  //Render that template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});
exports.getTour = AsyncCatch(async (req, res, next) => {
  // get data of tour review and guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  if (!tour) {
    return next(new AppError('There is no tour with this tour name', 404));
  }
  // .populate({ path: 'guides', fields: 'name photo role' });
  //build template
  //render template
  // console.log(typeof tour.images);
  res.status(200).render('tour', { title: `${tour.name}`, tour });
});
exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your Account'
  });
};
