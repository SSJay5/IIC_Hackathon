const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please provide name'] },
    image: { type: String },
    description: { type: String },
    products: [productSchema],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('product', {
  ref: 'Product',
  foreignField: '_id',
  localField: 'productId',
  justOne: true,
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
