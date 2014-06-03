// This passport strategy is like TokenStrategy with one major difference:
// It passes a dictionary to the verify function that contains the options that
// were passed to authenticate, which it can check out.
// (It doesn't inherit from TokenStrategy because the one function it needs to 
// override is 90% of the object's code.)

/**
 * Module dependencies.
 */
var passport = require('passport')
  , uri = require('url')
  , util = require('util')
  , utils = require('../../node_modules/passport-http-oauth/lib/passport-http-oauth/strategies/utils');


/**
 * `TokenOptionsStrategy` constructor.
 *
 * @param {Object} options
 * @param {Function} consumer
 * @param {Function} verify
 * @api public
 */
function TokenOptionsStrategy(options, consumer, verify, validate) {
  if (typeof options == 'function') {
    validate = verify;
    verify = consumer;
    consumer = options;
    options = {};
  }
  if (!consumer) throw new Error('HTTP OAuth token authentication strategy requires a consumer function');
  if (!verify) throw new Error('HTTP OAuth token authentication strategy requires a verify function');

  passport.Strategy.call(this);
  this.name = 'oauth';
  this._consumer = consumer;
  this._verify = verify;
  this._validate = validate;
  this._host = options.host || null;
  this._realm = options.realm || 'Users';
  this._ignoreVersion = options.ignoreVersion || false;
}

/**
 * Inherit from `passport.Strategy`.
 */

util.inherits(TokenOptionsStrategy, passport.Strategy);

/**
 * Authenticate request based on the contents of a HTTP OAuth authorization
 * header, body parameters, or query parameters.
 *
 * @param {Object} req
 * @api protected
 */

TokenOptionsStrategy.prototype.authenticate = function(req, options) {

  var params = undefined
    , header = null;

  if (req.headers && req.headers['authorization']) {
    var parts = req.headers['authorization'].split(' ');
    if (parts.length >= 2) {
      var scheme = parts[0];
      var credentials = null;

      parts.shift();
      credentials = parts.join(' ');

      if (/OAuth/i.test(scheme)) {
        params = utils.parseHeader(credentials);
        header = params;
      }
    } else {
      return this.fail(400);
    }
  }

  if (req.body && req.body['oauth_signature']) {
    if (params) { return this.fail(400); }
    params = req.body;
  }

  if (req.query && req.query['oauth_signature']) {
    if (params) { return this.fail(400); }
    token = req.query['access_token'];
    params = req.query;
  }

  // This is a terrible work around. It allows us to have 
  // optional enforcement of a token. If the user is not 
  // found then we can check for a value inthe API endpoint
  // definition that would allow the user in.

  if (!params && options.optional == true) {
    var self = this;
    return self.success({ type: 'guest' }, { account: { accounttype: 'guest' }});
  }

  // End of Hack for options.optional = TRUE
  
  if (!params) { return this.fail(this._challenge()); }

  // SSMITH - TODO Need to add in some debug info to help withi crap
  // console.log('oauth_consumer_key',params['oauth_consumer_key']);
  // console.log('oauth_token',params['oauth_token']);
  // console.log('oauth_signature_method',params['oauth_signature_method']);
  // console.log('oauth_signature',params['oauth_signature']);
  // console.log('oauth_timestamp',params['oauth_timestamp']);
  // console.log('oauth_nonce',params['oauth_nonce']);

  if (!params['oauth_consumer_key'] ||
      !params['oauth_token'] ||
      !params['oauth_signature_method'] ||
      !params['oauth_signature'] ||
      !params['oauth_timestamp'] ||
      !params['oauth_nonce']) {
    return this.fail(this._challenge('parameter_absent'), 400);
  }

  var consumerKey = params['oauth_consumer_key']
    , accessToken = params['oauth_token']
    , signatureMethod = params['oauth_signature_method']
    , signature = params['oauth_signature']
    , timestamp = params['oauth_timestamp']
    , nonce = params['oauth_nonce']
    , version = params['oauth_version']

  if (version && version !== '1.0' && !this._ignoreVersion) {
    return this.fail(this._challenge('version_rejected'), 400);
  }

  var self = this;
  this._consumer(consumerKey, function(err, consumer, consumerSecret) {

    if (err) { return self.error(err); }
    if (!consumer) { return self.fail(self._challenge('consumer_key_rejected')); }

    self._verify({tokenId: accessToken, authenticateOptions: options}, verified);

    function verified(err, user, tokenSecret, info) {
      // debugger;
      if (err) { return self.error(err); }
      if (!user) { return self.fail(self._challenge('token_rejected')); }

      info = info || {};
      info.scheme = 'OAuth';
      info.client =
      info.consumer = consumer;

      var url = utils.originalURL(req, self._host)
        , query = req.query
        , body = req.body;

      var sources = [ header, query ];
      if (req.headers['content-type'] &&
          req.headers['content-type'].slice(0, 'application/x-www-form-urlencoded'.length) ===
              'application/x-www-form-urlencoded') {
        sources.push(body);
      }

      var normalizedURL = utils.normalizeURI(url)
        , normalizedParams = utils.normalizeParams.apply(undefined, sources)
        , base = utils.constructBaseString(req.method, normalizedURL, normalizedParams);

      if (signatureMethod == 'HMAC-SHA1') {
        var key = utils.encode(consumerSecret) + '&';
        if (tokenSecret) { key += utils.encode(tokenSecret); }
        var computedSignature = utils.hmacsha1(key, base);

        // console.log('-------------')
        // console.log('normalizedURL', normalizedURL);
        // console.log('normalizedParams', normalizedParams);
        // console.log('consumerSecret', consumerSecret);
        // console.log('tokenSecret', tokenSecret);
        // console.log('key', key);
        // console.log('base', base);
        // console.log('Signature', signature, 'length', signature.length);
        // console.log('ComputedSignature', computedSignature, 'length:', computedSignature.length)

        if (signature !== computedSignature) {
          return self.fail(self._challenge('signature_invalid'));
        }
      } else if (signatureMethod == 'HMAC-SHA256') {
        var key = utils.encode(consumerSecret) + '&';
        if (tokenSecret) { key += utils.encode(tokenSecret); }
        var computedSignature = utils.hmacsha256(key, base);

        if (signature !== computedSignature) {
          return self.fail(self._challenge('signature_invalid'));
        }

      } else if (signatureMethod == 'PLAINTEXT') {
        var computedSignature = utils.plaintext(consumerSecret, tokenSecret);

        if (signature !== computedSignature) {
          return self.fail(self._challenge('signature_invalid'));
        }

      } else {
        return self.fail(self._challenge('signature_method_rejected'), 400);
      }

      // If execution reaches this point, the request signature has been
      // verified and authentication is successful.
      if (self._validate) {
        // Give the application a chance it validate the timestamp and nonce, if
        // it so desires.
        self._validate(timestamp, nonce, function(err, valid) {
          if (err) { return self.error(err); }
          if (!valid) { return self.fail(self._challenge('nonce_used')); }
          return self.success(user, info);
        });
      } else {
        return self.success(user, info);
      }
    }
  });
}

/**
 * Authentication challenge.
 *
 * References:
 *  - [Problem Reporting](http://wiki.oauth.net/w/page/12238543/ProblemReporting)
 *
 * @api private
 */
TokenOptionsStrategy.prototype._challenge = function(problem, advice) {
  var challenge = 'OAuth realm="' + this._realm + '"';
  if (problem) {
    challenge += ', oauth_problem="' + utils.encode(problem) + '"';
  }
  if (advice && advice.length) {
    challenge += ', oauth_problem_advice="' + utils.encode(advice) + '"';
  }
  return challenge;
}


/**
 * Expose `TokenOptionsStrategy`.
 */
module.exports = TokenOptionsStrategy;