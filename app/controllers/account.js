var swagger = require('swagger-node-express')
    , errors    = require('./lib/errors')
    , async     = require('async')
    , _         = require('underscore')
    , pager     = require('mongoose-query-paginate')
    , passport  = require('passport')
    , mongoose  = require('mongoose')
    , Account   = mongoose.model('Account')
    , Brick     = mongoose.model('Brick')
    , AccessToken = mongoose.model('AccessToken')

exports.current = {
  'spec': {
    'description': 'Get the Current User',
    'path': '/user/current',
    'notes': 'This endpoint provides the ability to retrieve the currently authenticated user.',
    'summary': 'Get Current User',
    'method': 'GET',
    'params': [],
    'errorResponses': [],
    'preliminaryCallbacks': [
      passport.authenticate('token', { session: false })
    ],
    'requestSignature': 'token',
    'nickname': 'current'
  },
  'action': function (req, res) {
    res.json(200, req.authInfo.account)
  }
}

exports.activity = {
  'spec': {
    'description': 'Get a activity',
    'path': '/user/{user}/activity',
    'notes': 'Returns a user activity',
    'summary': 'Get a user activity.',
    'method': 'GET',
    'params': [
      swagger.params.path('user', 'User ID', 'string')
    ],
    'errorResponses': [
      errors.invalid('id')
    ],
    'preliminaryCallbacks': [
      passport.authenticate('token', { optional: false, session: false })
    ],
    'nickname': 'activity'
  },
  'action': function (req, res) {

    req.assert('user', 'Invalid Object ID').isObjectID()
    if (req.validationErrors()) return errors.invalid('input', res, req.validationErrors())

    async.parallel({
      general: function(callback) {
        callback(err)
      }
    },
    function(err, r) {
      if (err)
        return req.send(500, 'Error getting user activity.')

      res.json(200, r)
    })

  }
}

var CalcDistance = function(loc1, loc2) {

  function toRad(Value) {
    /** Converts numeric degrees to radians */
    return Value * Math.PI / 180
  }

  // Check to see if we have an array from the object.
  if (_.isObject(loc2)) {
    if (loc2)
      loc2 = loc2.coordinates
    else
      loc2 = null
  }

  if (_.isArray(loc2))
    loc2 = { lng: loc2[0], lat: loc2[1] }

  if (!loc2)
    return { from: loc1, value: null, unit: 'miles', status: false, message: 'Missing Data' }

  var lat1 = loc1.lat,
      lon1 = loc1.lng || loc1.lon,
      lat2 = loc2.lat,
      lon2 = loc2.lng || loc2.lon

  try {
    // var R = 6371 // km
    var R = 3958.7558657440545 // miles

    var dLat = toRad( (lat2-lat1) )
    var dLon = toRad( (lon2-lon1) )
    var lat1 = toRad(lat1)
    var lat2 = toRad(lat2)

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    var d = R * c

    return { from: loc1, status: true, value: d, units: 'miles', message: '' }

  } catch(err) {
    return { from: loc1, value: null, units: 'miles', message: 'Error', status: false }
  }

}

exports.search = {
  'spec': {
    'description': 'Search Users',
    'path': '/user/search',
    'notes': 'Searchs for a user account using the criteria provided.',
    'summary': 'Get one or more user accounts.',
    'method': 'GET',
    'params': [
      swagger.params.query('term',     'Search Term', 'string'),
      swagger.params.query('id',       'User ID', 'string'),
      swagger.params.query('name',     'Users Full Name', 'string'),
      swagger.params.query('email',    'Email Address', 'string'),
      swagger.params.query('city',     'City', 'string'),
      swagger.params.query('state',    'State', 'string'),
      swagger.params.query('country',  'Country', 'string'),
      swagger.params.query('type',     'Account Type', 'string'),
      swagger.params.query('username', 'Username', 'string'),
      swagger.params.query('status',   'Account Status (Active, Inactive)', 'string'),
      swagger.params.query('email',    'Email Address', 'string'),
      swagger.params.query('provider',   'OAuth Provider Name (twitter, facebook etc.)', 'string'),
      swagger.params.query('providerid', 'OAuth Provider ID.', 'string'),
      swagger.params.query('twitter',    'Twitter Username', 'string'),
      swagger.params.query('facebook',   'Facebook Username', 'string'),
      swagger.params.query('lat', 'Latitude', 'string'),
      swagger.params.query('long', 'Longitude', 'string'),
      swagger.params.query('radius', 'Radius (Feet)', 'string'),
      swagger.params.query('limit', 'Limit the number of Users returns.', 'string'),
      swagger.params.query('page', '(Optiona) Current Page', 'string'),
      swagger.params.query('size', '(Optional) Page Size', 'string'),
      swagger.params.query('fields', 'Comma separated list of fields to return.', 'string'),
      swagger.params.query('format', 'Type of content returns, Raw, Statistics (Default is Raw)', 'string', false, false, 'LIST[raw,statistics,distinct]', 'raw'),
    ],
    'responseClass': 'User',
    'preliminaryCallbacks': [
      passport.authenticate('token', { optional: true, session: false })
    ],
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('User')
    ],
    'nickname': 'search'
  },
  'action': function (req, res) {

    var calcDistance = true
    var currentLoc = { lat: 31.7801399, lng: -95.80045109999999 }

    if (req.urlparams.term) {
      var term = req.urlparams.term.split('+').join(' ')
      var fields = (req.urlparams.fields || 'username,country,state,accounttype,email,name').split(',')

      var query = {
        'query': {
            'multi_match': {
                'fields': fields,
                'query': term,
                'type': 'prefix'
            }
        }

      }

      Account.search(query, { hydrate: true }, function(err, results) {
        if (err) console.log(err)
        if (err)
          return res.json(500, err)

        results.query = query
        results.term = term
        results.hits = results.hits.map(function(o) {
          o.distance = null
          return o.toObject()
        })

        if (calcDistance) {
          _.each(results.hits, function(o) {
            o.distance = CalcDistance(currentLoc, o.location.coordinates)
          })

          results.hits = _.sortBy(results.hits, function(o) {
            return -(o.distance.value) ? o.distance.value : 1000000
          })
        }

        res.json(200, results)
      })

      return
    }

    // -------------------------------------------------------

    if (req.urlparams.format == 'statistics') {

      var o = {}

      // TODO: Check that field/fields are valid.
      var field = _.first((req.urlparams.fields || 'country').split(','))

      // Define the map function for the field.
      o.map = 'function () {  if (this.' + field + ' != null) emit(this.' + field + ' || "NA", 1)  }'
      o.reduce = 'function (id, counts) { return Array.sum(counts) }'
      // TODO: o.query = { age : { $lt : 1000 }}

      // o.limit = 3           // max number of documents
      // o.keeptemp = true     // default is false, specifies whether to keep temp data
      // o.finalize = someFunc // function called after reduce
      // o.scope = {}          // the scope variable exposed to map/reduce/finalize
      // o.jsMode = true       // default is false, force execution to stay in JS

      o.verbose = true  // default is false, provide stats on the job

      Account.mapReduce(o, function (err, results, stats) {
        if (err)
          return res.json(500, err)

        var data = _.map(results, function(o) {
          return { value: o._id, count: o.value }
        })

        res.json(200, data)
      })

      return
    }

    // -------------------------------------------------------

    var query = Account.find({})
    query.sort('-name')

    var lng   = parseFloat(req.urlparams.lng || 0)
    var lat   = parseFloat(req.urlparams.lat || 0)

    if (lng != 0 && lat != 0)
      query.where('location').near({ center: [ lat, lng ], maxDistance: 100 })

    var f = 'username,country,city,state,accounttype,accountstate,email,name,twitter,facebook'
    _.each(f.split(','), function(o) {
      if (req.urlparams[o]) query.where(o).regex(new RegExp(req.urlparams[o], 'i'))
    })

    if (req.urlparams.id) query.where('_id').equals(req.urlparams.id)
    if (req.urlparams.provider) query.where('oauth.provider').equals(req.urlparams.provider)
    if (req.urlparams.providerid) query.where('oauth.providerid').equals(req.urlparams.providerid)

    if (req.urlparams.format != 'distinct')
      if (req.urlparams.fields) query.select(req.urlparams.fields || 'name email')

    var options = {
      perPage: req.urlparams.limit || 10,
      delta  : 1,
      page   : req.urlparams.page > 0 ? req.urlparams.page : 0
    }

    if (req.urlparams.format == 'distinct') {
      // Remove the sort, not needed for distinct.
      delete query.options['sort']

      var field = _.first( (req.urlparams.fields || 'username').split() )

      query.distinct(field, function(err, data) {
        if (err)
          return res.json(500, err)

        res.json(200, data)
      })
    }
    else {
      query.paginate(options, function(err, data) {
        if (err) return res.json(500, err)
        _.each(data.results, function(o) { delete o.password })

        data.results = data.results.map(function(o) {
          o.distance = null
          return o.toObject()
        })

        if (calcDistance) {
          _.each(data.results, function(o) {
            o.distance = CalcDistance(currentLoc, o.location)
          })

          data.results = _.sortBy(data.results, function(o) {
            return -(o.distance.value) ? o.distance.value : 1000000
          })
        }

        data._conditions = query._conditions
        res.json(200, data)
      })
    }

  }
}

exports.get = {
  'spec': {
    'description': 'Get a User',
    'path': '/user/{id}',
    'notes': 'Returns a users public profile, name, information and statistics. This \
              endpoint will return additional information when the user has a valid  \
              API key or an active session. Authenticated sessions will get access \
              to email, and private user information',
    'summary': 'Get a Users public information.',
    'method': 'GET',
    'params': [
      swagger.params.path('id', 'User ID', 'string')
    ],
    'responseClass': 'User',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('user')
    ],
    'preliminaryCallbacks': [
      passport.authenticate('token', { optional: true, session: false })
    ],
    'nickname': 'get'
  },
  'action': function (req, res) {

    req.assert('id', 'Invalid Account ID').isObjectID()
    if (req.validationErrors()) throw swagger.params.invalid('input', errors)

    Account.findOne({ _id : req.params.id })
      .exec(function(err, account) {
        if (err || !account)
          return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

        res.json(200, account)
      })

  }
}

exports.post = {
  'spec': {
    'description': 'Create a User',
    'path': '/user',
    'notes': 'Use this endpoint to create a User Account.',
    'summary': 'Create an Account',
    'method': 'POST',
    'params': [
      swagger.params.body('body', 'Account Data', 'User')
    ],
    'responseClass': 'User',
    'errorResponses': [
      errors.invalid('status')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', { optional: true, session: false })
    // ],
    'nickname': 'create'
  },
  'action': function (req, res) {

    var account = new Account(req.body)

    var CreateNow = function() {
      account.save(req, function (err) {
        if (err)
          return res.json(err.http_code || 500, err)

        var a = account.toObject()
        var accessToken = new AccessToken({ userId: account._id })

        accessToken.save(function(err) {
          // TODO: handler error?

          a.access = {
            token: accessToken.tokenId,
            token_secret: accessToken.secret
          }

          return res.json(200, a)
        })
      })
    }

    if (account.oauth.length > 0) {
      var provider = _.first(account.oauth)

      var opts = {
        'oauth.provider': provider.provider || '',
        'oauth.providerid': provider.providerid || ''
      }

      Account.find(opts).exec(function(err, result) {
        if (err)
          return res.json(500, 'We were unable to use this ' + provider.provider + ' account.')

        if (result.length > 0)
          return res.json(500, 'Oops. There is already an account for this ' + provider.provider + ' account.')

        return CreateNow()
      })
    } else
      CreateNow()

  }
}

exports.delete = {
  'spec': {
    'description': 'Delete a User Profile',
    'path': '/user/{id}',
    'notes': 'Delete a User Profile.',
    'summary': 'Delete a User Profile.',
    'method': 'DELETE',
    'params': [
      swagger.params.path('id', 'User ID', 'string')
    ],
    'responseClass': 'Account',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Account')
    ],
    'preliminaryCallbacks': [
      passport.authenticate('token', {session: false})
    ],
    'nickname': 'delete'
  },
  'action': function (req,res) {

    req.assert('id', 'Invalid Account ID').isObjectID()
    if (req.validationErrors()) throw swagger.params.invalid('input', errors)

    Account.load(req.params.id, function (err, account) {
      if (err || !account)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      account.remove(function (err, account) {
        if (err)
          return res.json(err.http_code || 500, err)

        res.json(200, 'Account Deleted.')
      })
    })

  }
}

exports.putOauth = {
  'spec': {
    'description': 'Update Account Provider',
    'path': '/user/{id}/provider',
    'notes': 'Use this endpoint to provides the ability to update an accounts provider links.',
    'summary': 'Update an account Provider',
    'method': 'PUT',
    'params': [
      swagger.params.path('id', 'User ID', 'string'),
      swagger.params.body('body', 'User Account to Update.', 'string' )
    ],
    'errorResponses': [
      errors.invalid('status')
    ],
    'preliminaryCallbacks': [
      passport.authenticate('token', { session: false })
    ],
    'nickname': 'oauth'
  },
  'action': function (req, res) {

    req.assert('id', 'Invalid Account ID').isObjectID()
    if (req.validationErrors()) throw swagger.params.invalid('input', errors)

    Account.load(req.params.id, function (err, account) {
      if (err || !account)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      // If have a provider but no id.
      var subOauth = _.find(account.oauth, function(i) { return i.provider == req.body.provider })

      var execSave = function(err) {
        if (account.isModified()) {
          account.save(req, function (err) {
            if (err)
              return res.json(err.http_code || 500, err)

            res.json(200, account.toObject() )
          })
        } else
          res.json(200, account.toObject() )
      }

      if (subOauth) {
        var subOauthDoc = account['oauth'].id(subOauth._id.toString())

        // if we do not have an ID, then we delete the provider.
        if (req.body.provider && !req.body.providerid) {
          // subOauthDoc.remove()
          account['oauth'].id(subOauth._id).remove()
        } else {
          subOauthDoc.providerid = req.body.providerid
          subOauthDoc.data = req.body.data || {}
        }

        execSave()

      } else {
        // If no existing subdocument found, then we assume we need to create one.

        var opts = {
          //'_id': { $ne: req.params.id },
          'oauth.provider': req.body.provider,
          'oauth.providerid': req.body.providerid
        }

        var OtherAccounts = mongoose.model('Account')
        OtherAccounts.find(opts).exec(function (err, otherAccounts) {
          if (otherAccounts.length > 0)
            return res.json(404, 'Provider information alread attached to an account.')

          // Set the new OAuth Provider info
          account.oauth.push({
            provider: req.body.provider,
            providerid: req.body.providerid,
            data: req.body.data
          })

          execSave()
         })

      }

    })
  }
}

exports.put = {
  'spec': {
    'description': 'Update a User',
    'path': '/user/{id}',
    'notes': 'Use this endpoint to update a User Profile.',
    'summary': 'Update a User Profile',
    'method': 'PUT',
    'params': [
      swagger.params.path('id', 'User ID', 'string'),
      swagger.params.body('body', 'User Account to Update.', 'string' )
    ],
    'errorResponses': [
      errors.invalid('status')
    ],
    'preliminaryCallbacks': [
      passport.authenticate('token', { session: false })
    ],
    'nickname': 'update'
  },
  'action': function (req, res) {

    req.assert('id', 'Invalid Account ID').isObjectID()
    if (req.validationErrors()) throw swagger.params.invalid('input', errors)

    Account.load(req.params.id, function (err, account) {
      if (err || !account)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      account = _.extend(account, req.body)

      if (account.isModified()) {

        account.save(req, function (err) {
          if (err)
            return res.json(err.http_code || 500, err)

          res.json(200, account.toObject())
        })
      } else
        res.json(200, account.toObject())

    })
  }
}
