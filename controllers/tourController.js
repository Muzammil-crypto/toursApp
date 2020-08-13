/* eslint-disable prettier/prettier */
const Tour = require('../models/tourModel');
const AsyncCatch = require('./../utils/AsyncCatch');
const AppError = require('../utils/appError');
const factoryHandler = require('./factoryHandler');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,ratingsAverage,price';
  next();
};

exports.getAllTours = factoryHandler.getAll(Tour);
exports.getTour = factoryHandler.getOne(Tour);
exports.createTour = factoryHandler.createOne(Tour);
exports.updateTour = factoryHandler.updateOne(Tour);
exports.deleteTour = factoryHandler.deleteOne(Tour);

// exports.getAllTours = AsyncCatch(async (req, res) => {
//   // const queryObj = { ...req.query };
//   // const exludedFields = ['sort', 'limit', 'page', 'fields'];
//   // exludedFields.forEach(el => delete queryObj[el]);

//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//   // console.log(JSON.parse(queryStr));

//   // let query = Tour.find(JSON.parse(queryStr));
//   //2SORTING
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   query = query.sort(sortBy);
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }
//   //3Field Limiting
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   query = query.select(fields);
//   //   console.log(req.query.limit);
//   // } else {
//   //   query = query.select('-__v');
//   // }
//   //4 pagination
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 3;
//   // const skip = (page - 1) * limit;

//   // query = query.skip(skip).limit(limit);
//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) throw new Error('this page does not Exist');
//   // }
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;
//   // const tours = await Tour.find();

//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.responseTime,
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
// });

// exports.getTour = AsyncCatch(async (req, res) => {
//   const tour = await Tour.findById(req.params.id)
//     .populate({
//       path: 'guides',
//       select: '-__v'
//     })
//     .populate('reviews');
//   if (!tour) {
//     return new AppError('No tour found with that Id', 404);
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

// exports.createTour = AsyncCatch(async (req, res) => {
//   // eslint-disable-next-line no-console
//   console.log(req.body);
//   const newTour = await new Tour(req.body);
//   const tour = await newTour.save();
//   res.status(201).json({ status: 'success', data: { tour } });
// });

// exports.updateTour = AsyncCatch(async (req, res) => {
//   const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });
//   if (!updatedTour) {
//     return new AppError('No tour found with that Id', 404);
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: updatedTour
//     }
//   });
// });

// exports.deleteTour = AsyncCatch(async (req, res) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return new AppError('No tour found with that Id', 404);
//   }
//   res.status(204).json({
//     status: 'success',
//     data: 'Deleted successfully'
//   });
// });

exports.getTourStats = AsyncCatch(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        // numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  res.status(200).json({
    status: 'succuess',
    data: stats
  });
});

exports.getMonthlyPlan = AsyncCatch(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: { _id: 0 }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: 'succuess',
    data: {
      plan
    }
  });
});
exports.getToursWithin = AsyncCatch(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  // eslint-disable-next-line no-console
  console.log(radius);
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });
  res
    .status(200)
    .json({ status: 'success', results: tours.length, data: { data: tours } });
});
exports.getDistances = AsyncCatch(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const muliplier = unit === 'mi' ? 0.000621371 : 0.001;
  // eslint-disable-next-line no-console
  console.log(lat);
  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  //multiplies lat for converting to string
  //geonear should be first stage
  //project will only show the mentioned fields
  const distance = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: muliplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    results: distance.length,
    data: { data: distance }
  });
});
