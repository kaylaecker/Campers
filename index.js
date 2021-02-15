const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');

const campgroundRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  useFindAndModify: false,
})
.then(() => {
  console.log("Mongo CONNECITON OPEN")
})
.catch(err => {
  console.log("Mongo ERROR")
  console.log(err)
})

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({extended: true })) //req.body is undefined unless we tell express to use middleware
app.use(methodOverride('_method')) //let you use things like put
app.use(express.json()) //tells express to parse the body as json
app.use(express.static(path.join(__dirname, 'public')))
const sessionConfig = {
  secret: 'thisshouldbeabettersecret!',
  resave: false,
  saveUninitialized: true, 
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }
  
  //eventually will also have a scale for store
}
app.use(session(sessionConfig))
app.use(flash())

app.use(passport.initialize());
app.use(passport.session()); //must come after app.use(session(sessionConfig))
passport.use(new LocalStrategy(User.authenticate())); //we're saying hello passport, we would like you to use the local strategy 
//that we required and for it, the authenticated method is located on our User model and it's called authenticate. 
//(we didn't make it, comes from passport local mongoose)

passport.serializeUser(User.serializeUser()); //store - this tells passport how to serialize a user - refers to how to store a user in the session
passport.deserializeUser(User.deserializeUser()); //unstore - how do you get a user out of the session (both methods added in thanks to plugin passport local mongoose)


app.use((req, res, next) => {
  console.log(req.session)
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})
// because it's before route handlers, on every single request, we are going to take 
//whatever is in the flash under success and have access to it in our locals under key success

/*
/register get - FORM
& post - creates user
login is a get, has login form
& post to login 
*/

app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewsRoutes);
app.use('/', userRoutes);

app.get("/", (req, res) => {
  res.render('index')
})

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