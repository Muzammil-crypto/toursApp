const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AsyncCatch = require('./../utils/AsyncCatch');
const factoryHandler = require('./factoryHandler');
const AppError = require('../utils/appError');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image!Please upload an image', 400), false);
  }
};

// const upload = multer({ dest: 'public/img/users' });
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  if (req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = AsyncCatch(async (req, res) => {
  const Users = await User.find();
  res.status(500).json({
    success: 'success',
    Users
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    success: 'error',
    message: 'use /login instead of this route'
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    success: 'error',
    message: 'use /signup instead of this route'
  });
};

// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     success: 'error',
//     message: 'this route is not developed'
//   });
// };
//Do not update password with patch
exports.updateUser = factoryHandler.updateOne(User);
exports.deleteUser = factoryHandler.deleteOne(User);
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = AsyncCatch(async (req, res, next) => {
  // eslint-disable-next-line no-console
  console.log(req.file);
  // eslint-disable-next-line no-console
  console.log(req.body);

  // create error if user posted password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates.Please use /updateMyPassword.',
        400
      )
    );
  }
  // update user document
  //filter body so role like fields cannot be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});
exports.deleteMe = AsyncCatch(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
