/* Dependencies */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require('crypto')
  , _ = require('underscore')
  // , Queue = require('../../config/queue')
  , GeoCode = require('./middlewares/geocode')

/* Plugins */

var mongoosastic = require('mongoosastic')
var createdModifiedPlugin = require('mongoose-createdmodified').createdModifiedPlugin

/* OAuth SubSchema */

var OauthSchema = new Schema({
  provider    : { type: String, required: true },
  providerid  : { type: String, required: true },
  data        : Schema.Types.Mixed
})

OauthSchema.plugin(createdModifiedPlugin, { index: true })

var AccountSchema = new Schema({
  name:            { type: String, default: '', es_indexed: true, index: true },
  email:           { type: String, default: '', es_indexed: true },
  username:        { type: String, required: true, es_indexed: true, default: '', index: { unique: true } },
  hashed_password: { type: String, default: '', select: false },
  salt:            { type: String, default: '', select: false },
  bio:             { type: String, required: false },
  // Social Media
  twitter:         { type: String, es_indexed: true },
  facebook:        { type: String, es_indexed: true },
  foursquare:      { type: String },
  // Address
  city:            { type: String, es_indexed: true },
  state:           { type: String, es_indexed: true },
  country:         { type: String, es_indexed: true },
  location:        { meta: { type: String, default: '' },      // 23 Main Street, Boston MA
                     type: { type: String, default: 'Point'},  // Point, LineString, Poly
                     coordinates: { type: Array }              // Lat Long
                   },
  // General
  avatar:          { type: String },
  accountstatus:   { type: String, default: 'new' },
  accounttype:     { type: String, default: 'general' },
  website:         { type: String, es_indexed: true },
  oauth:           [ OauthSchema ]

}, { collection: 'account' })

AccountSchema.index({ 'location.coordinates': '2d' })

/* Index for oauth Providers */
AccountSchema.index({ 'oauth.provider': 1, 'oauth.providerid': 1 })

AccountSchema.plugin(createdModifiedPlugin, {index: true})

/** Virtuals **/

AccountSchema
  .virtual('password')
  .set(function(password) {
    this._password = password
    this.salt = this.makeSalt()
    this.hashed_password = this.encryptPassword(password)
  })
  .get(function() { return this._password })

/* Validations */

AccountSchema.path('name').validate(function (name) {
  return (name || '').length
}, 'Name cannot be blank')

AccountSchema.path('email').validate(function (email) {
  return email.length
}, 'Email cannot be blank')

AccountSchema.path('email').validate(function (email, fn) {
  var User = mongoose.model('Account')

  if (this.isModified('email')) {
    if (this.isNew) {
      User.find({ email: email }).exec(function (err, users) {
        fn(!err && users.length === 0)
      })
    } else {
      User.find({ _id: { $ne: this._id }, email: email }).exec(function (err, users) {
          fn(!err && users.length === 0)
      })
    }
  } else {
    fn(true)
  }

}, 'Email already exists' )

AccountSchema.path('username').validate(function (username, fn) {
  var User = mongoose.model('Account')

  if (this.isModified('username')) {
    if (this.isNew) {
      User.find({ username: username }).exec(function (err, users) {
        fn(!err && users.length === 0)
      })
    } else {
      User.find({ _id: { $ne: this._id }, username: username }).exec(function (err, users) {
          fn(!err && users.length === 0)
      })
    }
  } else {
    fn(true)
  }

}, 'Username already exists' )

AccountSchema.path('hashed_password').validate(function (hashed_password) {
  if (this.isNew || this.isModified('password')) {
    return hashed_password.length
  } else return true
}, 'Password cannot be blank')


/* Pre-save hook */

AccountSchema.pre('save', function(next) {

  if (!this.isNew) return next()
  next()
})

/* Post-save hook */

/* Handle changes to the City, State or Country fields.
   Will trigger a geoCoding event on Google Maps API.
*/

AccountSchema.pre('save', function(next, req, callback) {

  var self = this

  // If we have a change to city, state or country
  if (this.isModified('city') || this.isModified('state') || this.isModified('country')) {

    // Loop the possible address fields. And build an address array. Order
    // is important.

    var address = []
    _.each(['city', 'state', 'country'], function(locName) {
      if (self[locName])
        address.push(self[locName])
    })

    GeoCode.fromAddress(address, function(err, location) {
      if (err)
        return next(callback)

      // If we have location, then store the data in
      // the account document.

      if (location)
        self.location = {
          type: 'Point',
          meta: location.meta,
          coordinates: [ location.lng, location.lat ]
        }

      console.log("GeoCode the User location.")
      return next(req, callback)
    })
  } else {
    return next(req, callback)
  }
})

AccountSchema.pre('save', function(next, req, callback) {

  if (this.isNew) {
    // Queue.q.enqueue('newAccount', { id: this._id.toString() }, function(err, job) {
    //   if (err) throw err
    //   console.log('Enqueued New Account Email')
    // })

    return next(callback)
  }

  // This is hack to allow the indexing to work. If we only
  // have two arguments, then assume it is because we do not
  // have the req available.
  if (arguments.length == 2) {
    return next(callback)
  }

  // Not now, so we check permissions.

  var currentId   = req.user.userId.toString()
  var currentRole = req.authInfo.account.accounttype || 'general'
  var override = false

  /* User must meet at least one of the following criteria:
   *
   * 1. User is the current owner of the account.
   * 2. Account Type of Super User (su)
   * 3. Override is true
   */

  if (this._id.toString() == currentId || currentRole == 'su' || override) {
    // console.log('Has Permissions = true')
    next(callback)
  } else {
    var error = new Error('No Write Permission')
    error.http_code = 401

    next(error)
  }
})


/* Methods */

AccountSchema.methods = {

  /*
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   *
   */

  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password
  },

  /*
   * Make salt
   *
   * @return {String}
   * @api public
   */

  makeSalt: function () {
    return Math.round((new Date().valueOf() * Math.random())) + ''
  },

  /*
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   *
   */

  encryptPassword: function (password) {
    if (!password) return ''
    var encrypred
    try {
      encrypred = crypto.createHmac('sha1', this.salt).update(password).digest('hex')
      return encrypred
    } catch (err) {
      console.log('Error iun encryptPassword', err)
      return ''
    }
  }

}

AccountSchema.statics = {

  /*
   * Find by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   *
   */

  load: function(id, cb) {
    this.findOne({ _id : id })
      .exec(cb)
  },

  findUserByUsername: function(username, password, cb) {
    this.findOne({ username: username }).select('salt hashed_password').exec(cb)
  },

  findbyId: function(id, cb) {
    this.findOne({ _id: id }).populate('favorites').exec(cb)
  }
}

/* Elastic Search */

// var connectionString = require('url').parse(process.env.SEARCHBOX_URL);
//
// AccountSchema.plugin(mongoosastic, {
//   index: 'legojs-mongoose',
//   port: 80,
//   host: connectionString.auth + '@' + connectionString.hostname
// })

mongoose.model('Account', AccountSchema)
