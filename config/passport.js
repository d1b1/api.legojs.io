var mongoose = require('mongoose')
  , LocalStrategy    = require('passport-local').Strategy
  , ConsumerStrategy = require('passport-http-oauth').ConsumerStrategy
  , TokenStrategy    = require('passport-http-oauth').TokenStrategy
  , TokenOptionsStrategy = require('./auth/TokenOptionsStrategy');

module.exports = function(passport) {

  var Account   = mongoose.model('Account')
  var Consumer  = mongoose.model('Consumer')
  var Token     = mongoose.model('AccessToken')
  var Nonce     = mongoose.model('Nonce')

  inMemoryNonceCache = {}

  /*
   * LocalStrategy
   *
   * This strategy is used to authenticate users based on a username and password.
   * Anytime a request is made to authorize an application, we must ensure that
   * a user is logged in before asking them to approve the request.
   */

  passport.use('local', new LocalStrategy(function(username, password, done) {

      Account
        .findUserByUsername(username, password, function (err, account) {
          if (err) 
            return done(err)

          if (!account)
            return done(null, false, { message: 'Invalid Username and Password.' } )

          if (!account.authenticate(password))
            return done(null, false, { message: 'Invalid password' })

          return done(null, true, account)
        })
    }
  ))

  /*
   * ConsumerStrategy
   *
   * This strategy is used to authenticate registered consumers (aka clients).
   * It is employed to protect the accesstoken endpoints, which consumers use to 
   * request access tokens.
   */

  passport.use('consumer', new ConsumerStrategy(
    // consumer callback
    //
    // This callback finds the registered client associated with `consumerKey`.
    // The client should be supplied to the `done` callback as the second
    // argument, and the consumer secret known by the server should be supplied
    // as the third argument.  The `ConsumerStrategy` will use this secret to
    // validate the request signature, failing authentication if it does not
    // match.
    function(consumerKey, done) {

      verifyConsumer(consumerKey, done, function onVerifySuccess(error, consumer) {     
        if (!consumer) {
          console.log('TODO: Got no consumer')      
        }     
        done(null, consumer, consumer.consumerSecret)
      })

    },
    // token callback
    //
    function(requestToken, done) {
      // In xAuth-style auth, there is no request token, just access tokens.
      // Just skip forward.   
      done(null, true)
    },
    // validate callback
    //
    // Check timestamps and nonces, as a precaution against replay attacks.
    function(timestamp, nonce, done) {
      verifyTimestamp(timestamp, done, function onVerifiedStamp() {
        verifyNonce(timestamp, nonce, done, function onVerifiedNonce() {
          done(null, true)
        })
      })
    })
  );

  /**
   * TokenStrategy
   *
   * This strategy is used to authenticate users based on an access token.  The
   * user must have previously authorized a client application, which is issued an
   * access token to make requests on behalf of the authorizing user.
   */

  passport.use('token', new TokenOptionsStrategy(
    // consumer callback
    //
    // This callback finds the registered client associated with `consumerKey`.
    // The client should be supplied to the `done` callback as the second
    // argument, and the consumer secret known by the server should be supplied
    // as the third argument.  The `TokenStrategy` will use this secret to
    // validate the request signature, failing authentication if it does not
    // match.

    function(consumerKey, done) {
      verifyConsumer(consumerKey, done, function onVerifySuccess(error, consumer) {
        done(null, consumer, consumer.consumerSecret)
      })
    },

    // verify callback
    //
    // This callback finds the user associated with `accessToken`.  The user
    // should be supplied to the `done` callback as the second argument, and the
    // token secret known by the server should be supplied as the third argument.
    // The `TokenStrategy` will use this secret to validate the request signature,
    // failing authentication if it does not match.
    //
    // Furthermore, additional arbitrary `info` can be passed as the fourth
    // argument to the callback.  An access token will often have associated
    // details such as scope of access, expiration date, etc.  These details can
    // be retrieved from the database during this step.  They will then be made
    // available by Passport at `req.authInfo` and carried through to other
    // middleware and request handlers, avoiding the need to do additional
    // unnecessary queries to the database.
    //
    // Note that additional access control (such as scope of access), is an
    // authorization step that is distinct and separate from authentication.
    // It is an application's responsibility to enforce access control as
    // necessary.

    function(verificationInfo, done) {

      Token.findbyTokenId(verificationInfo.tokenId, function(err, token) {
        var expectedGrants = null
        
        if (err) return done(err)

        if (!token) {
          done(null, false)
        } else {
          Account.findbyId(token.userId, function (err, account) {
            if (err) return done(err)
            
            if (!account) {
              done(null, false)
            } else {
              done(null, token, token.secret, { account: account })               
            }  

          })

        }
      })

    },
    // Validate callback
    //
    // The application can check timestamps and nonces, as a precaution against
    // replay attacks.  In this example, no checking is done and everything is
    // accepted.
    //
    function(timestamp, nonce, done) {

      // First, make sure the timestamp is reasonably close to the time we've got.
      verifyTimestamp(timestamp, done, function onVerifiedStamp() {
        // Then, check the nonce.

        verifyNonce(timestamp, nonce, done, function onVerifiedNonce() {
          done(null, true)
        })

      })

    }
  ))

  /* Methods common to multiple strategies */

  // Params shared by these methods:
  //
  // passportDone: Called only if there's a failure or error. Up to the caller to
  // call inform passport of in case of success.
  //
  // successCallback: Called if the verification completes successfully. Two
  // params: error (null if there's no error). The rest of the params are specific
  // to the function.

  // Here, successCallback's second param will be the consumer object.
  function verifyConsumer(consumerKey, passportDone, successCallback) {

    Consumer.findByKey(consumerKey, function(err, consumer) {
        if (err) return passportDone(err)

        if (!consumer) {
          passportDone(null, false)
        } else {
          successCallback(null, consumer)     
        }

    })

    // store.findConsumerByKey(consumerKey, function(error, consumer) {    
    //   if (error) { 
    //     passportDone(error)
    //   }
    //   if (!consumer) {
    //     passportDone(null, false)
    //   }
    //   else {
    //     successCallback(null, consumer)    
    //   }
    // })

  }

  // Timestamp variables.
  var timestampTolerance = 15 * 60 * 1000

  function verifyTimestamp(timestamp, passportDone, successCallback) {
    var serverTime = new Date().getTime()
    var timeDiff = serverTime - parseInt(timestamp)
    if (Math.abs(timeDiff) > timestampTolerance) {
      passportDone(null, false, {
        message: 'The timestamp should be within ' + timestampTolerance + 
          ' of our time. It\'s off by: ' + timeDiff
        })
    }

    successCallback()
  }

  // Assumes timestamp is already verified.
  function verifyNonce(nonce, timestamp, passportDone, successCallback) {

    successCallback()

    // timestamp = parseInt(timestamp);
    //
    // if (nonce in inMemoryNonceCache) {
    //
    //   passportDone(null, false, {
    //     failureMessage: 'The nonce ' + nonce + ' has been used recently. IN MEMORY.'
    //   })
    //
    // } else {    
    //
    //   // We need to save this in memory immediately in case another request 
    //   // with the same nonce comes in immediately, before the mongo insert 
    //   // below has time to complete.
    //
    //   inMemoryNonceCache[nonce] = timestamp;
    //
    //   store.nonceExistsInStore(nonce, timestamp, function(error, exists) {
    //
    //     if (error) {
    //       passportDone(error);
    //     }
    //     else if (exists) {
    //       passportDone(null, false, {
    //         failureMessage: 'The nonce ' + nonce + ' has been used recently. IN DB.'
    //       })
    //     } else {
    //       // Save this nonce.
    //
    //       store.saveNonceTimestampPair(nonce, timestamp, function(error, id) {
    //         if (error) return passportDone(error)

    //         successCallback()
    //       })
    //     }
    //   })
    // }
    //
    // TODO: Clear out nonces that are expired, both in memory and in the DB.   
  }

}