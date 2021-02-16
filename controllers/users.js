const User = require('../models/user');

module.exports.renderRegister = (req, res) => {
  res.render('users/register')
}

module.exports.register = async (req, res, next) => {
  try{
    const { email, username, password } = req.body;
    const user = new User({ email, username }) //first make a basic user instance, where we pass in the username and email but not password
    const registeredUser = await User.register(user, password) //takes the new user that we made (the instance) and the password, it hashes the password and stores the salts and hash results on the new user
    req.logIn(registeredUser, err => {
      if(err) return next(err)
      req.flash('success', 'Welcome to Yelp Camp!');
      res.redirect('/campgrounds')
    })
  } catch(e) {
    req.flash('error', e.message);
    res.redirect('/register');
  }
}
//adds internal try/catch to handle errors in a more clear particular way

module.exports.renderLogin = (req, res) => {
  res.render('users/login');
}

module.exports.login = (req, res) => {
  req.flash('success', 'welcome back!');
  const redirectUrl = req.session.returnTo || '/campgrounds';
  delete req.session.returnTo;
  res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
  req.logOut();
  req.flash('success', 'Goodbye');
  res.redirect('/campgrounds');
}