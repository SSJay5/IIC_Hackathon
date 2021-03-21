const User = require('../models/userModel');
const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const moment = require('moment');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = catchAsync(async (req, res, next) => {
  let me = await User.findOne({ _id: req.user._id })
    .populate('productsYetToBeSold.productId')
    .populate('productsSold.productId')
    .populate('sub.user');
  const startOfDay = moment(Date.now()).startOf('day').format();
  const endOfDay = moment(Date.now()).endOf('day').format();
  const startOfWeek = moment(Date.now()).startOf('week').format();
  const endOfWeek = moment(Date.now()).endOf('week').format();
  const startOfMonth = moment(Date.now()).startOf('month').format();
  const endOfMonth = moment(Date.now()).endOf('month').format();
  me = JSON.parse(JSON.stringify(me));
  let profitInDay = 0;
  let profitInWeek = 0;
  let profitInMonth = 0;
  for (let i = 0; i < me.productsSold.length; i += 1) {
    if (
      me.productsSold[i].date.substr(10) >= startOfDay.substr(10) &&
      me.productsSold[i].date.substr(10) <= endOfDay.substr(10)
    ) {
      profitInDay +=
        me.productsSold[i].productId.mrp * me.productsSold[i].quantity;
    }
    if (
      me.productsSold[i].date.substr(10) >= startOfWeek.substr(10) &&
      me.productsSold[i].date.substr(10) <= endOfWeek.substr(10)
    ) {
      profitInWeek +=
        me.productsSold[i].productId.mrp * me.productsSold[i].quantity;
    }
    if (
      me.productsSold[i].date.substr(10) >= startOfMonth.substr(10) &&
      me.productsSold[i].date.substr(10) <= endOfMonth.substr(10)
    ) {
      profitInMonth +=
        me.productsSold[i].productId.mrp * me.productsSold[i].quantity;
    }
  }
  me.profitInDay = profitInDay;
  me.profitInWeek = profitInWeek;
  me.profitInMonth = profitInMonth;
  res.status(200).json({
    me,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
