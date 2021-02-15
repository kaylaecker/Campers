const express = require('express');
const router = express.Router({mergeParams: true });
const Review = require('../models/review');
const Campground = require('../models/campground');
const { validateReview, isLoggedIn } = require('../middleware');

const catchAsync = require('../utils/catchAsync');

router.post('/', validateReview, isLoggedIn, catchAsync(async(req, res) => {
  const campground = await Campground.findById(req.params.id);
  const review = new Review(req.body.review)
  review.author = req.user._id;
  campground.reviews.push(review);
  await campground.save();
  await review.save();
  req.flash('success', "Created new review!")
  res.redirect(`/campgrounds/${campground._id}`);
}))

router.delete('/:reviewId', catchAsync(async(req, res) => {
  const { id, reviewId } = req.params;
  await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId }});
  await Review.findByIdAndDelete(reviewId)
  req.flash('success', 'Review deleted')
  res.redirect(`/campgrounds/${id}`);
}))

module.exports = router;