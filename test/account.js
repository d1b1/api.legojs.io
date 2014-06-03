var api     = require('./lib/braque')
var helpers = require('./lib/helpers')
var assert  = require('assert')
var mongodb = require('mongodb')

var userProfile = {}
var secondaryProfile = {}
var baseAccount = {}

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

      baseAccount = account
      done()
    })
  })

  it('should GET an account', function(done) {
    api.user.get({ id: baseAccount._id }, baseAccount, function(err, account) {
      assert.ok(err==null, 'No Error')
      assert.equal(account.name, baseAccount.name, 'Name is valid')
      done()
    })
  })

  it('should UPDATE an account', function(done) {
    var accountData = { name: "Jane Doe" }

    api.user.update({ id: baseAccount._id, body: accountData }, baseAccount, function(err, account) {
      assert.ok(err==null, 'No Error')
      assert.equal(account.name, accountData.name, 'Name was changed')
      done()
    })
  })

  it('should SEARCH accounts by username', function(done) {
    api.user.search({ username: baseAccount.username }, baseAccount, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.equal(results.results.length, 1, 'Return a single result')
      assert.equal(results.count, 1, 'Return a single result')
      done()
    })
  })

  // -------------------------------------------------------------------
  // Attempt to GET / Update Invalid Document ID

  it('should fail to GET a Bogus User', function(done) {
    api.user.get({ id: new mongodb.ObjectID().toString()  }, userProfile, function(err, user) {
      assert.ok(err.code == 404)
      done()
    })
  })

  it('should fail to GET a Bogus User', function(done) {
    api.user.update({ id: new mongodb.ObjectID().toString(), body: {}  }, userProfile, function(err, favorite) {
      assert.ok(err.code == 404)
      done()
    })
  })

  it('should fail to DELETE a Bogus User', function(done) {
    api.user.delete({ id: new mongodb.ObjectID().toString()  }, userProfile, function(err, favorite) {
      assert.ok(err.code == 404)
      done()
    })
  })

  // -------------------------------------------------------------------

  it('should DELETE an account', function(done) {
   api.user.delete({ id: baseAccount._id }, userProfile, function(err, data) {
     assert.ok(err==null, 'No Error')
     done()
   })
  })

})
