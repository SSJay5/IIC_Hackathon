const mongoose = require('mongoose');

const subProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number },
    date: { type: Date },
    paymentType: { type: String },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

subProductSchema.virtual('productData', {
  ref: 'Product',
  foreignField: '_id',
  localField: 'product',
  justOne: true,
});
subProductSchema.virtual('buyerData', {
  ref: 'User',
  foreignField: '_id',
  localField: 'buyer',
  justOne: true,
});

subProductSchema.virtual('sellerData', {
  ref: 'User',
  foreignField: '_id',
  localField: 'seller',
  justOne: true,
});
const SubProduct = mongoose.model('SubProduct', subProductSchema);

module.exports = SubProduct;
