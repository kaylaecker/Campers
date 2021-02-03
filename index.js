const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const Campground = require('./models/campground');
const Review = require('./models/review');

const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const { campgroundSchema, reviewSchema } = require('./validationSchemas');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
  console.log("Mongo CONNECITON OPEN")
})
.catch(err => {
  console.log("Mongo ERROR")
  console.log(err)
})

const app = express();

app.use(express.urlencoded({extended: true })) //req.body is undefined unless we tell express to use middleware
app.use(methodOverride('_method')) //let you use things like put
app.use(express.json()) //tells express to parse the body as json

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

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

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body)
  if(error){
    const msg = error.details.map(el => el.message).join(',')
    throw new ExpressError(msg, 400)
  } else {
    next();
  }
}

app.get("/", (req, res) => {
  res.render('index')
})

app.get('/campgrounds', catchAsync(async (req, res) => {
  const campgrounds = await Campground.find({})
  res.render('campgrounds/index', { campgrounds }) 
}))

app.get('/campgrounds/new', (req, res) => {
  res.render('campgrounds/new')
})

app.get('/campgrounds/:id', catchAsync(async(req, res) => {
  const { id } = req.params
  const campground = await Campground.findById(id).populate('reviews');
  res.render('campgrounds/show', {campground})
}))

app.get('/campgrounds/:id/edit', catchAsync(async (req,res) => {
  const { id } = req.params
  const campground = await Campground.findById(id)
  res.render('campgrounds/edit', { campground} )
}))

app.post('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {
  //can now give ExpressError a message and status code, and it will make way to the handler
  //will use default/back up if nothing provided 
  // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400)
  const campground = new Campground(req.body.campground)
  await campground.save();
  res.redirect(`/campgrounds/${campground.id}`)
}))

app.put('/campgrounds/:id', validateCampground, catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground}, {new:true})
  res.redirect(`/campgrounds/${campground._id}`)
}))

app.delete('/campgrounds/:id', catchAsync(async(req, res) => {
  const { id } = req.params;
  const deletedCampground = await Campground.findByIdAndDelete(id)
  res.redirect('/campgrounds')
}))

app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async(req, res) => {
  const campground = await Campground.findById(req.params.id);
  const review = new Review(req.body.review)
  campground.reviews.push(review);
  await campground.save();
  await review.save();
  res.redirect(`/campgrounds/${campground._id}`);
}))

app.delete('/campground/:id/reviews/:reviewId', catchAsync(async(req, res) => {
  const { id, reviewId } = req.params;
  await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId }});
  await Review.findByIdAndDelete(reviewId)
  res.redirect(`/campgrounds/${id}`);
}))

app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404))
}) //we pass this new error to next, which means that 
//it will hit this error handler (below), and error will be this express error
//should give status code a default when destructuring from error
app.use((err, req, res, next) => {
  const { statusCode = 500} = err
  if(!err.message) err.message = "Something went horrible awry!"
  res.status(statusCode).render('error', {err})
})

app.listen(3000, ()=> {
  console.log("Serving on port 3000")
})