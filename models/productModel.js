const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    company: { type: String },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide reference to user'],
    },
    name: { type: String, default: 'No Name Given' },
    modelNumber: { type: String },
    mrp: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    image: [{ type: String }],
    avgRating: { type: Number, default: 5 },
    noOfRating: { type: Number, default: 1 },
    description: { type: String },
    status: { type: String, default: 'admin' },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('ownerData', {
  ref: 'User',
  foreignField: '_id',
  localField: 'owner',
  justOne: true,
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
