const Category = require('../models/categoryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeature');

exports.createCategory = catchAsync(async (req, res, next) => {
  const newCategory = await Category.create(req.body);

  res.status(201).json({
    status: 'success',
    category: newCategory,
  });
});

exports.addProducts = catchAsync(async (req, res, next) => {
  const currentCategory = await Category.findOne({ _id: req.params.id });
  for (let i = 0; i < req.body.products; i += 1) {
    currentCategory.products.push(req.body.products[i]);
  }
  await currentCategory.save({
    validateBeforeSave: false,
    runValidators: false,
  });
  res.status(200).json({
    status: 'success',
    category: currentCategory,
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const updatedCategory = await Category.findByIdAndUpdate(
    { _id: req.params.id },
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    category: updatedCategory,
  });
});

exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await (
    await Category.findOne({ _id: req.params.id })
  ).populate('product');

  res.status(200).json({
    status: 'success',
    category: category,
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const doc = await Category.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
