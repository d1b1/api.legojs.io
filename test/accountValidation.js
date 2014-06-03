var api     = require('./lib/braque')
var helpers = require('./lib/helpers')
var assert  = require('assert')
var mongodb = require('mongodb')

var userProfile = {}
var secondaryProfile = {}
var baseAccount = {}
var accounts = {}

before(function(done) {
   api.authenticate.accesstoken({ body: { username: 'api', password: 'tester'}}, {}, function(err, account) {
     userProfile.access = {
        token_secret: account.secret,
        token: account.tokenId
     }
     done()
   })
})

describe('Account CRUD', function(done) {

  it('should get CURRENT', function(done) {

    api.user.current({}, userProfile, function(err, account) {
      assert.ok(err==null, 'No Error')
      assert.equal(account.username, 'api', 'Username is valid')
      assert.equal(account.email, 'api.tester@legojs.io', 'Email is valid')

      done()
    })
  })

  it('should CREATE an account', function(done) {
    var accountData = helpers.createAccount()

    api.user.create({ body: accountData }, userProfile, function(err, account) {
      if (err) console.log('Error', err)
      assert.ok(err==null, 'No Error')
      assert.equal(account.username, accountData.username, 'Username is valid')

      accounts.one = account
      done()
    })
  })

  it('should CREATE an account', function(done) {
    var accountData = helpers.createAccount()

    api.user.create({ body: accountData }, userProfile, function(err, account) {
      if (err) console.log('Error', err)
      assert.ok(err==null, 'No Error')
      assert.equal(account.username, accountData.username, 'Username is valid')

      accounts.two = account
      done()
    })
  })

  // -------------------------------------------------------------------

  it('should CREATE an account with missing required values', function(done) {
    var accountData = {}

    api.user.create({ body: accountData }, userProfile, function(err, account) {
      var errors = {}
      if (err)
        if (err.data)
          errors = err.data.errors

      assert.ok( errors.name != null, 'Name validition was required')
      assert.ok( errors.email != null, 'Email validition was required')
      assert.ok( errors.username != null, 'Username validition was required')
      assert.ok( errors.hashed_password != null, 'Password validition was required')

      done()
    })
  })

  // -------------------------------------------------------------------

  it('should UPDATE an account one email/username', function(done) {

    var accountData = {
      email: accounts.two.email,
      username: accounts.two.username
    }

    api.user.update({ id: accounts.one._id, body: accountData }, userProfile, function(err, account) {
      var errors = {}
      if (err)
        if (err.data)
          errors = err.data.errors

      assert.equal( errors.email.message, 'Email already exists', 'Email validition was required')
      assert.equal( errors.username.message, 'Username already exists', 'Userbame validition was required')
      done()
    })
  })

  // -------------------------------------------------------------------

  it('should DELETE an account one', function(done) {
   api.user.delete({ id: accounts.one._id }, userProfile, function(err, data) {
     assert.ok(err==null, 'No Error')
     done()
   })
  })

  it('should DELETE an account two', function(done) {
   api.user.delete({ id: accounts.two._id }, userProfile, function(err, data) {
     assert.ok(err==null, 'No Error')
     done()
   })
  })

})
