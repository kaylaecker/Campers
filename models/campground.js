const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;


const CampgroundSchema = new Schema({
  title: String,
  image: String,
  price: Number,
  description: String,
  location: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review',
    }
  ]
});

//this is a post not a pre which is fine, we have access to what was just deleted as it is passed in
//start by console.log(doc)
CampgroundSchema.post('findOneAndDelete', async function (doc) {
  if(doc){
    await Review.deleteMany({
      _id: {
        $in: doc.reviews
      }
    })
  }
})


module.exports = mongoose.model('Campground', CampgroundSchema);