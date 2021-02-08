const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
const { campgroundSchema } = require('../validationSchemas');


//middleware, so the signature is req, res, next
const validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body)
  if(error){
    const msg = error.details.map(el => el.message).join(',')
    throw new ExpressError(msg, 400)
  } else {
    // need this part if you want to keep going through to the route handler
    // should this not result in an error
    next();
  }
}

router.get('/', catchAsync(async (req, res) => {
  const campgrounds = await Campground.find({})
  res.render('campgrounds/index', { campgrounds }) 
}))

router.get('/new', (req, res) => {
  res.render('campgrounds/new')
})

router.get('/:id', catchAsync(async(req, res) => {
  const { id } = req.params
  const campground = await Campground.findById(id).populate('reviews');
  if(!campground) {
    req.flash('error', 'Campground Not Found');
    return res.redirect('/campgrounds');
  }
  res.render('campgrounds/show', {campground})
}))

router.get('/:id/edit', catchAsync(async (req,res) => {
  const { id } = req.params
  const campground = await Campground.findById(id)
  if(!campground) {
    req.flash('error', 'Campground Not Found');
    return res.redirect('/campgrounds');
  }
  res.render('campgrounds/edit', { campground} )
}))

router.post('/', validateCampground, catchAsync(async (req, res, next) => {
  //can now give ExpressError a message and status code, and it will make way to the handler
  //will use default/back up if nothing provided 
  // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400)
  const campground = new Campground(req.body.campground)
  await campground.save();
  req.flash('success', 'Successfully made a new campground!')
  res.redirect(`/campgrounds/${campground.id}`)
}))

router.put('/:id', validateCampground, catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground}, {new:true})
  req.flash('success', 'Successfully updated campground');
  res.redirect(`/campgrounds/${campground._id}`)
}))

router.delete('/:id', catchAsync(async(req, res) => {
  const { id } = req.params;
  const deletedCampground = await Campground.findByIdAndDelete(id)
  req.flash('success',  `${deletedCampground.title} successfully deleted`)
  res.redirect('/campgrounds')
}))

module.exports = router;