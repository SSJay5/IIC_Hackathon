/* eslint-disable no-await-in-loop */
const Product = require('../models/productModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const SubProduct = require('../models/subProductModel');
const Email = require('../utils/email');
const fast2sms = require('fast-two-sms');

exports.updateProduct = catchAsync(async (req, res, next) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  if (!updatedProduct) {
    return next(new AppError('No document found with that ID', 404));
  }
  const currentUser = await User.findOne({ _id: req.user._id });
  for (let i = 0; i < currentUser.productsYetToBeSold.length; i += 1) {
    if (
      JSON.stringify(updatedProduct._id) ===
      JSON.stringify(currentUser.productsYetToBeSold[i].productId)
    ) {
      currentUser.productsYetToBeSold[i].quantity = updatedProduct.quantity;
    }
  }
  console.log(currentUser);
  await currentUser.save({
    validateBeforeSave: false,
    runValidators: false,
  });
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
          }
          currentUser.productsSold.push({
            productId: req.body.productId,
            quantity: req.body.quantity,
          });
          if (currentUser.productsYetToBeSold[i].quantity < 10) {
            const product = await Product.findOne({
              _id: currentUser.productsYetToBeSold[i].productId,
            });
            const numbers = [currentUser.phoneNumber];
            const sendSms = await fast2sms.sendMessage({
              authorization: process.env.FAST2SMS_API_KEY,
              message: `${currentUser.name} Your Product ${product.name} is about to go out of stock`,
              numbers,
            });
          }
          const buyerAgent = await User.findOne({ _id: req.body.buyer });
          buyerAgent.productsYetToBeSold.push({
            productId: req.body.productId,
            quantity: req.body.quantity,
          });
          await buyerAgent.save({
            validateBeforeSave: false,
            runValidators: false,
          });
        }
        await currentUser.save({
          validateBeforeSave: false,
          runValidators: false,
        });
      }
    }
    if (productFound === false) {
      return next(new AppError('Product not found', 400));
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
          await currentUser.save({
            validateBeforeSave: false,
            runValidators: false,
          });
          res.status(200).json({
            status: 'success',
            productSold: subProduct,
          });
          const newSubProduct = await SubProduct.findOne({
            _id: subProduct._id,
          }).populate('productData');
          res.redirect(
            `https://iic-hackathon.herokuapp.com/api/v1/products/invoice/${subProduct._id}`
          );
        }
      }
    }
    if (productFound === false) {
      return next(new AppError('Product not found', 400));
    }
  } else
    res.status(401).json({
      status: 'fail',
      message: 'You can only pruchase products',
    });
});

exports.statusOfProduct = catchAsync(async (req, res, next) => {
  const subProduct = await await SubProduct.findOne({
    _id: req.body.barcode,
  }).populate('productData');
  if (subProduct !== null) {
    res.status(200).json({
      status: 'sold',
      subProduct,
    });
  } else {
    const product = await Product.findOne({
      _id: req.body.barcode,
    }).populate('ownerData');
    if (product === null) {
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
    res.status(200).json({
      status: `Product is with Admin ${product.ownerData.name}`,
    });
  }
});

exports.getInvoice = catchAsync(async (req, res, next) => {
  const newSubProduct = await SubProduct.findOne({
    _id: req.params.id,
  })
    .populate('productData')
    .populate('buyerData')
    .populate('sellerData');
  console.log(newSubProduct);
  res.status(200).render('invoice', newSubProduct);
});
