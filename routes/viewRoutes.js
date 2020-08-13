const express = require('express');

const viewRouter = express.Router();

const { isLoggedIn } = require('../controllers/authController');

const {
  getOverview,
  getTour,
  getLoginForm
} = require('../controllers/viewsController');

viewRouter.use(isLoggedIn);

viewRouter.get('/', getOverview);
viewRouter.get('/tour/:slug', getTour);
viewRouter.get('/Login', getLoginForm);

module.exports = viewRouter;
