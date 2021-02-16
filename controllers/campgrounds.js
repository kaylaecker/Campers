//these controller methods will be passed into the routes

const Campground = require('../models/campground');

module.exports.index = async (req, res) => {
  const campgrounds = await Campground.find({})
  res.render('campgrounds/index', { campgrounds }) 
}

module.exports.renderNewForm = (req, res) => {
  res.render('campgrounds/new')
}

module.exports.showCampground = async(req, res) => {
  const { id } = req.params
  const campground = await Campground.findById(id).populate({
    path: 'reviews',
    populate: {
      path: 'author'
    }
  }).populate('author');
  if(!campground) {
    req.flash('error', 'Campground Not Found');
    return res.redirect('/campgrounds');
  }
  res.render('campgrounds/show', {campground})
}

module.exports.createCampground = async (req, res, next) => {
  //can now give ExpressError a message and status code, and it will make way to the handler
  //will use default/back up if nothing provided 
  // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400)
  const campground = new Campground(req.body.campground)
  campground.author = req.user._id;
  await campground.save();
  req.flash('success', 'Successfully made a new campground!')
  res.redirect(`/campgrounds/${campground.id}`)
}

module.exports.renderEditForm = async (req,res) => {
  const { id } = req.params
  const campground = await Campground.findById(id)
  if(!campground) {
    req.flash('error', 'Campground Not Found');
    return res.redirect('/campgrounds');
  }
  res.render('campgrounds/edit', { campground} )
}

module.exports.updateCampground = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground}, {new:true})
  req.flash('success', 'Successfully updated campground');
  res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCampground = async(req, res) => {
  const { id } = req.params;
  const deletedCampground = await Campground.findByIdAndDelete(id)
  req.flash('success',  `${deletedCampground.title} successfully deleted`)
  res.redirect('/campgrounds')
}