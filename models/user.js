const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose')

const UserSchema = new Schema({
  email: {
    type: String,
    require: true,
    unique: true, //not validation, it sets up an index only
  }
});

UserSchema.plugin(passportLocalMongoose)
//pass in the result of requiring the package to UserSchema.plugin. This is going to add on to our schema a salt,
// a username, a field for password, makes sure usernames are unique/not duplicated, also gives additional methods to us

module.exports = mongoose.model('User', UserSchema);