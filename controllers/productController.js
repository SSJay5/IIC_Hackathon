/* eslint-disable no-await-in-loop */
const Product = require('../models/productModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const SubProduct = require('../models/subProductModel');

exports.updateProduct = catchAsync(async (req, res, next) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!updatedProduct) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    updatedProduct: updatedProduct,
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const doc = await Product.findByIdAndDelete(req.params.id);
  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  const product = await Product.create(req.body);
  const currentUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $push: {
        productsYetToBeSold: {
          productId: product._id,
          quantity: product.quantity,
        },
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(201).json({
    status: 'success',
    product: product,
  });
});

exports.sellProduct = catchAsync(async (req, res, next) => {
  if (req.user.role === 'admin') {
    let productFound = false;
    const currentUser = await User.findOne({ _id: req.user._id });
    for (let i = 0; i < currentUser.productsYetToBeSold.length; i += 1) {
      if (
        JSON.stringify(currentUser.productsYetToBeSold[i].productId) ===
        JSON.stringify(req.body.productId)
      ) {
        productFound = true;
        if (currentUser.productsYetToBeSold[i].quantity < req.body.quantity) {
          throw new Error(
            `You can only sell upto ${currentUser.productsYetToBeSold[i].quantity}`
          );
        } else {
          currentUser.productsYetToBeSold[i].quantity -= req.body.quantity;
          if (currentUser.productsYetToBeSold[i].quantity === 0) {
            currentUser.productsYetToBeSold[i].splice(i, 1);
            currentUser.productsSold.push({
              productId: req.body.productId,
              quantity: 0,
            });
            const buyerAgent = await User.findOne({ _id: req.body.buyer });
            buyerAgent.productsYetToBeSold.push({
              productId: req.body.productId,
              quantity: req.body.quantity,
            });
            await buyerAgent.save();
          }
          await currentUser.save();
        }
      }
    }
    if (productFound === false) {
      throw new AppError('Product not found', 400);
    }
    res.status(200).json({
      status: 'success',
    });
  } else if (req.user.role === 'agent') {
    let productFound = false;
    const currentUser = await User.findOne({ _id: req.user._id });
    for (let i = 0; i < currentUser.productsYetToBeSold.length; i += 1) {
      if (
        JSON.stringify(currentUser.productsYetToBeSold[i].productId) ===
        JSON.stringify(req.body.productId)
      ) {
        productFound = true;
        if (currentUser.productsYetToBeSold[i].quantity < req.body.quantity) {
          throw new Error(
            `You can only sell upto ${currentUser.productsYetToBeSold[i].quantity}`
          );
        } else {
          currentUser.productsYetToBeSold[i].quantity -= 1;
          const subProduct = await SubProduct.create({
            product: req.body.productId,
            buyer: req.body.buyer,
            seller: req.user._id,
            rating: req.body.rating,
            date: Date.now(),
            paymentType: req.body.paymentType,
          });
          currentUser.productsSold.push({
            productId: subProduct._id,
            quantity: 0,
          });
          await currentUser.save();
          res.status(200).json({
            status: 'success',
            productSold: subProduct,
          });
        }
      }
    }
    if (productFound === false) {
      throw new AppError('Product not found', 400);
    }
  }

  res.status(401).json({
    status: 'fail',
    message: 'You can only pruchase products',
  });
});

exports.statusOfProduct = catchAsync(async (req, res, next) => {
  const subProduct = await (
    await SubProduct.findOne({ _id: req.body.barcode })
  ).populate('productData');
  if (subProduct) {
    res.status(200).json({
      status: 'sold',
      subProduct,
    });
  } else {
    const product = await (
      await Product.findOne({ _id: req.body.barcode })
    ).populate('ownerData');
    if (!product) {
      throw new AppError('Product not found', 400);
    }

    for (let i = 0; i < product.ownerData.sub.length; i += 1) {
      const currentAgent = await User.findOne({
        _id: product.ownerData.sub[i],
      });
      for (let j = 0; j < currentAgent.productsYetToBeSold.length; j += 1) {
        if (
          JSON.stringify(currentAgent.productsYetToBeSold[j].productId) ===
          JSON.stringify(req.body.barcode)
        ) {
          res.status(200).json({
            status: `Product is with Agent ${currentAgent.name} and was given by ${req.user.name} at`,
          });
        }
      }
    }
  }
  res.status(404).json({
    status: 'Product not found',
  });
});
