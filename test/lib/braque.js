
var Braque = require('braque')

var api = new Braque({
    version: '2.0.0',
    routeFile: './test/api.json',
    debug: false,
    protocol: 'http',
    host: 'localhost',
    port: 3000
})

var authUtil = require('./authUtil');
var oauth = require('./oauth').oauth;

module.exports = api

api.authenticate({
  consumer_key: 'abc123',
  consumer_secret: 'ssh-secret',
  type: 'custom',

  custom: function(api, method, url, extras) {
 
    // User Token Access is stored in the the Profile.Account.Access
    var userAccess = null;
    if (extras.access) {
      userAccess = extras.access;
    }

    var params = {
      oauth_nonce:            authUtil.uid(16),
      oauth_timestamp:        authUtil.getTime(),
      oauth_version:          '1.0',
      oauth_consumer_key:     api.auth.consumer_key,
      oauth_signature_method: 'HMAC-SHA1',  
    }

    var options = { 
      method: method, 
      url: url, 
      consumerSecret: api.auth.consumer_secret
    }

    // if we have session tokens defined, use them.
    if (userAccess) {
      if (userAccess.token && userAccess.token_secret) { 
        params.oauth_token = userAccess.token;
        options.tokenSecret = userAccess.token_secret;
        if (api.debug)
          console.log('Added a full signed token.')
      }   
    } else {
      if (api.debug)
        console.log('No Token Siging.')
    }

    // Add the signature to the params destined for header.
    params.oauth_signature = authUtil.signRequest(params, options, api.debug)

    return oauth.getAuthorizationHeader('', params)
  }
})
