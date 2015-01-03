var swagger = require('swagger-node-express')
    , errors      = require('./lib/errors')
    , _           = require('underscore')
    , passport    = require('passport')
    , mongoose    = require('mongoose')
    , Account     = mongoose.model('Account')
    , AccessToken = mongoose.model('AccessToken')

var provider_types = [ 'twitter', 'google', 'facebook', 'instagram' ]

exports.accesstoken = {
  'spec': {
    'description' : 'Obtain an access token',
    'path': '/authenticate/accesstoken',
    'notes': 'Get an access token.',
    'summary': 'Get an access token',
    'method': 'POST',
    'params': [
      swagger.params.body('body', 'Username & Password Request.', 'TokenRequest' ),
    ],
    'responseClass': 'accesstoken',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('accesstoken')
    ],
    'nickname': 'accesstoken',
    'preliminaryCallbacks': [
      passport.authenticate('consumer', { session: false }),
      passport.authenticate('local', { session: false } )
    ],
    'requestSignature': 'consumer'
  },
  'action': function(req, res) {

    // TODO: If there is an active token then use it.
    // other wise we are supporting multiple logins. Sincel
    // token will allow us to log a user out.

    var token = new AccessToken();
    token.userId = req.authInfo._id 

    token.save(function (err) {
      if (err) return res.json(404, err)
      res.json(200, token.toObject())
    })

  }
}

exports.accessProvider = {
  'spec': {
    'description' : 'Obtain an access token by provider',
    'path': '/authenticate/byprovider',
    'notes': 'Get a user and access token by OAuth Provider',
    'summary': 'Get an access token',
    'method': 'POST',
    'params': [
      swagger.params.body('body', 'Provider and Provider ID', 'TokenRequest' ),
    ],
    'responseClass': 'accesstoken',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('accesstoken')
    ],
    'nickname': 'byprovider',
    'preliminaryCallbacks': [
      passport.authenticate('consumer', { session: false }),
    ],
    'requestSignature': 'consumer'
  },
  'action': function(req, res) {
 
     req.checkBody('providerid', 'Invalid Provider ID').notEmpty()
     req.checkBody('provider', 'Invalid Provider Type (twitter, google, facebook, instagram').isIn(provider_types)

     if (req.validationErrors()) throw errors.invalid('input', null, req.validationErrors())
  
     Account.find({ 
       oauth: { $elemMatch: { provider: req.body.provider, providerid: req.body.providerid } } 
     }).exec(function(err, results) {

        // Need to return a better message.
        if (err) return res.send(err, 500)

        // If we do not find anyting, then return a 404.
        if (_.isEmpty(results))
          return res.json(404, 'No Account Found')

        // If we find a single account, then return it.
        if (results.length == 1) {

          // TODO: Need to refactor this to make it clear. Look at the data 
          // that we feed into the function above.

          var token = new AccessToken()
          token.userId = results[0]._id 

          token.save(function (err) {
            if (err) 
              return res.json(404, err)

            res.json(200, token.toObject())
            return
          })

        } else {
          // We we have not result, then we need to create 
          // an account. how do we do this.
          console.log('Found more then One Account.', results)
          
          res.json(500, 'Found more then one account for this provider. Not possible.')
        }

     }) 

  }
}