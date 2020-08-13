const AppError = require('../utils/appError');

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      // eslint-disable-next-line no-console
      console.error('ERROR ', err);
      return res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
  //B)Rendered wensites
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message
    });
    //other programming error
  }
  // eslint-disable-next-line no-console
  console.error('ERROR ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later'
  });
};
const sendErrorDev = (err, req, res) => {
  //1)API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }
  //2)Rendered website
  // eslint-disable-next-line no-console
  console.error('ERROR ', err);

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message
  });
};

const handleCastErrorDB = err => {
  const message = `invalid ${err.path}:${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
  const message = `Duplicate field value: ${value} .Please use another value`;
  return new AppError(message, 400);
};

const handleJWTMisspell = () => {
  return new AppError(
    'Something went wrong with authentication.Please Login again!',
    401
  );
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // let error = { ...err }; //comment it

  // console.log('error controller runs');

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTMisspell();
    }

    sendErrorProd(error, req, res);
  }
};
