module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); //.catch(err => next(err)) when next receives err auto calls error middleware
  };
};
