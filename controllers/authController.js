const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const AsyncCatch = require('../utils/AsyncCatch');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  res.cookie('hello', 'hello', { httpOnly: false });
  //important

  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

exports.signup = AsyncCatch(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;
  const url = `${req.protocol}://${req.get('host')}`;
  // console.log(url);

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role
  });

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = AsyncCatch(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide your Email and Password', 400));
  }
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Please enter Correct Email and Password', 401));
  }
  // console.log('hello from auth');
  createSendToken(user, 200, res);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = AsyncCatch(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // return next(new AppError('Please Login to get access to this route', 401));
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // token = req.headers.authorization.split(' ')[1];
  // console.log(token);
  if (!token) {
    return next(
      new AppError('You are not logged in. please login to get accesss', 401)
    );
  }
  // res.send(token);

  //Decode Token for user and his id
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //   res.send(decoded);
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exists...',
        401
      )
    );
  }
  const changedPasssword = freshUser.matchExpirePassword(decoded.iat);
  if (changedPasssword) {
    return next(new AppError('password is modified:please login again', 401));
  }
  req.user = freshUser;
  // console.log(' hello from protect auth');
  next();
});
// only for render pages does not have error
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      const changedPasssword = currentUser.matchExpirePassword(decoded.iat);
      if (changedPasssword) {
        return next();
      }
      //There is a logged in user
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // console.log(req.user);
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      // console.log('inside roles include');
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgetPassword = AsyncCatch(async (req, res, next) => {
  //check if user exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Email does not Exit', 404));
  }
  //create reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //send it to email provided

  // const message = `Forget you Password? Click at the URL ${resetURL} to reset you password with new password. If you did not sent this forgot password email request please ignore this message`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token valid for 10mints',
    //   message
    // });
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await User.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'there was an error while sending a reset Email! Please try later',
        500
      )
    );
  }
});

exports.resetPassword = AsyncCatch(async (req, res, next) => {
  //1-get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() }
  });

  //2-token not expired and user exist , set new password
  if (!user) {
    return next(new AppError('Reset Token has Expired', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  //3-update changedPasswordAt property
  //implemented at model .pre('save') level
  //4-Log user in
  createSendToken(user, 200, req);
});

exports.updatePassword = AsyncCatch(async (req, res, next) => {
  //find the user
  const user = await User.findById(req.user._id).select('+password');
  //match its password
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError('Please recheck you Password! It does not match.', 401)
    );
  }
  //update his password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //send new JWT token
  createSendToken(user, 200, res);
});
