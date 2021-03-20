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
    mrp: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    image: [{ type: String }],
    avgRating: { type: Number, default: 5 },
    noOfRating: { type: Number, default: 1 },
    description: { type: String },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('owner', {
  ref: 'User',
  foreignField: '_id',
  localField: 'owner',
  justOne: true,
});

const Product = new mongoose.model('User', userSchema);
