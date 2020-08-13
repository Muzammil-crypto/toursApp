const AsyncCatch = require('./../utils/AsyncCatch');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.createOne = Model =>
  AsyncCatch(async (req, res) => {
    // eslint-disable-next-line no-console
    // console.log(req.body);
    const newDoc = await new Model(req.body);
    const doc = await newDoc.save();
    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOption) =>
  AsyncCatch(async (req, res) => {
    let query = Model.findById(req.params.id);
    if (popOption) {
      query = query.populate(popOption);
    }
    const doc = await query;
    if (!doc) {
      return new AppError('No doc found with that Id', 404);
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.getAll = Model =>
  AsyncCatch(async (req, res, next) => {
    const filter = {};
    if (req.params.tourId) {
      filter.tour = req.params.tourId;
    }
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    // const tours = await features.query.explain();
    // const tours = await Tour.find();

    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });

exports.deleteOne = Model =>
  AsyncCatch(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return new AppError('No Document found with that Id', 404);
    }
    res.status(204).json({
      status: 'success',
      data: 'Deleted successfully'
    });
  });

exports.updateOne = Model =>
  AsyncCatch(async (req, res) => {
    const updatedDoc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updatedDoc) {
      return new AppError('No Document found with that Id', 404);
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: updatedDoc
      }
    });
  });
