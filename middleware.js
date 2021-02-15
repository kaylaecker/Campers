const { campgroundSchema, reviewSchema } = require('./validationSchemas');
const Campground = require('./models/campground');
const ExpressError = require('./utils/ExpressError');

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
      req.session.returnTo = req.originalUrl
      req.flash('error', 'You must be signed in first!');
      return res.redirect('/login');
  }
  next();
}

//middleware, so the signature is req, res, next
module.exports.validateCampground = (req, res, next) => {
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

module.exports.isAuthor = async(req, res, next) => {
  const { id } = req.params;
  const camp = await Campground.findById(id);
  if(!camp.author.equals(req.user._id)) { //protects against things like postman from updating if not owner
    req.flash('error', 'You need to be the author to update')
    return res.redirect(`/campgrounds/${id}`)
  }
  next();
}

module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body)
  if(error){
    const msg = error.details.map(el => el.message).join(',')
    throw new ExpressError(msg, 400)
  } else {
    next();
  }
}