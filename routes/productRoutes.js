const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

const router = express.Router();

router.route('/invoice/:id').get(productController.getInvoice);
router.use(authController.protect);

router
  .route('/')
  .post(authController.restrictTo('admin'), productController.createProduct);
router
  .route('/:id')
  .patch(authController.restrictTo('admin'), productController.updateProduct)
  .delete(authController.restrictTo('admin'), productController.deleteProduct);

router.route('/status').post(productController.statusOfProduct);

router.route('/sell').post(productController.sellProduct);

module.exports = router;
