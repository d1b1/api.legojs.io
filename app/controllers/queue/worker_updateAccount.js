var mongoose = require('mongoose')

module.exports = function(params, callback) {

  var Account = mongoose.model('Account')
  var Favorite = mongoose.model('Favorite')

  Account.load(params.id.toString(), function(err, account) {
   if (err) return callback(null, 'Error getting account')
   if (!account) return callback(null, 'No Account Found.');

   Favorite.find({ owner: params.id.toString() }).count(function(err, data) {
     if (err) return callback(null, 'Error getting Favorites')

     account._meta = { total_favorites: total }
   
     account.save(function(err) {
       callback(null, 'Updated Account _meta')
     })
   })

  })

}