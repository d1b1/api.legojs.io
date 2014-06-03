var mongoose = require('mongoose')

/* Plugins */

var createdModifiedPlugin = require('mongoose-createdmodified').createdModifiedPlugin

var getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

var Makeuid = function(len) {
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)])
  }

  return buf.join('')
}

/* Schema */

var TokenSchema = new mongoose.Schema({
  tokenId:        { type: String, default: '', index: true }, 
  secret:         { type: String, default: '' },
  userId:         String
}, { collection: 'accessTokens' })

TokenSchema.plugin(createdModifiedPlugin, {index: true})

/* Validations */

/* Post-save hook */

TokenSchema.pre('save', function(next) {
  
  if (this.isNew) {
    this.tokenId = Makeuid(16)
    this.secret = Makeuid(64)
  }

  next()
})

/* Methods */

TokenSchema.statics = {

  /**
   * Find by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id }).exec(cb)
  },

  findbyTokenId: function (tokenId, cb) {
    this.findOne({ tokenId : tokenId }).exec(cb)
  }

}

mongoose.model('AccessToken', TokenSchema)