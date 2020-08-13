const express = require('express');

const userRouter = express.Router();

const {
  signup,
  login,
  forgetPassword,
  resetPassword,
  protect,
  updatePassword,
  restrictTo,
  logout
} = require('../controllers/authController');

const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  // getMe,
  updateMe,
  deleteMe,
  uploadUserPhoto,
  resizeUserPhoto,
  getMe
} = require('../controllers/userController');

userRouter.route('/signup').post(signup);
userRouter.route('/login').post(login);
userRouter.route('/logout', logout);
userRouter.route('/forgetPassword').post(forgetPassword);
userRouter.route('/resetPassword/:token').post(resetPassword);

userRouter.use(protect);
userRouter.get('/me', getMe, getUser);
userRouter.patch('/updateMyPassword', updatePassword);
// userRouter.get('/me', protect, getMe, getUser);
userRouter.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe); //updateMe and deleteMe functions has to be made
userRouter.delete('/deleteMe', protect, deleteMe);
// userRouter.get('/', (req, res, next) => {
//   res.send('hello forget from user Route');
// });

userRouter.use(restrictTo('admin'));

userRouter
  .route('/')
  .get(getAllUsers)
  .post(createUser);

userRouter
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = userRouter;
