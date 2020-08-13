const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const dot = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

dot.config({
  path: './config.env'
});
const viewRouter = require('./routes/viewRoutes');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoute');
const bookingRouter = require('./routes/bookingRoute');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

//Set Security HTTP headers
app.use(helmet());

// eslint-disable-next-line eqeqeq
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//Limit IP request
const Limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP,Please try again in an hour!'
});
app.use(cors());
app.use('/api', Limiter);

//Body Parser
app.use(
  express.json({
    limit: '10kb'
  })
);
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization NOSQL injustion {"email":{$gt:""}} always true
app.use(mongoSanitize());

//Data sanitize HTML sanitize
app.use(xss());

//Prevent params polution like sort=pice&sort=name create a array but sort works on strings only
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
      'ratingsQuantity'
    ]
  })
);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.mongoURILOCAL, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    });
    console.log(`connected to DB and ${process.env.NODE_ENV}`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

connectDB();

// app.use((req, res, next) => {
//   req.responseTime = new Date().toISOString();
//   next();
// });

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(`${req.cookies.jwt} from app.js`);
  next();
});

//Routes

app.use('/llogin', (req, res, next) => {
  res.cookie('lloginApp', 'hello sufi from app', {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000)
  });
  res.send('login');
});
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter);

app.all('*', (req, res, next) => {
  // const err = new Error(`page not found ${req.originalUrl}`);
  // err.statusCode = 404;
  // err.status = 'fail';
  next(new AppError(`cant find ${req.originalUrl} at this server`, 404));
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Running at ${PORT}`);
});
//pug user part3 on ward
