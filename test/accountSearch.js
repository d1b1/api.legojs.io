var api     = require('./lib/braque')
var helpers = require('./lib/helpers')
var assert  = require('assert')
var Faker   = require('Faker')
var _       = require('underscore')

// Update to create makers and test the search options

var userProfile = {}

before(function(done) {
   api.authenticate.accesstoken({ body: { username: 'api', password: 'tester'}}, {}, function(err, account) {
     userProfile.access = {
        token_secret: account.secret,
        token: account.tokenId
     }
     done()
   })
})

var baseAccount = {}

describe('Account Search', function(done) {

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

  it('should search by name', function(done) {
    api.user.search({ name: baseAccount.name }, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.equal(results.count, 1, 'Found a single account')
      assert.equal( _.first(results.results)._id, baseAccount._id, 'Found the Specific Account')
      done()
    })
  })

  it('should search by name & city', function(done) {
    api.user.search({ name: baseAccount.name, city: baseAccount.city }, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.equal(results.count, 1, 'Found a single account')
      assert.equal( _.first(results.results)._id, baseAccount._id, 'Found the Specific Account')
      done()
    })
  })

  it('should search by name, type & country', function(done) {
    api.user.search({ name: baseAccount.name, texture: baseAccount.texture, country: baseAccount.country }, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.equal(results.count, 1, 'Found a single account')
      assert.equal( _.first(results.results)._id, baseAccount._id, 'Found the Specific Account')
      done()
    })
  })

  it('should search FREE Text', function(done) {

    var opts = { term: baseAccount.username }

    api.user.search(opts, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.ok(results.total > 0, 'Found Search Results')
      done()
    })
  })

  it('should delete', function(done) {
   api.user.delete({ id: baseAccount._id }, userProfile, function(err, data) {
     assert.ok(err==null, 'No Error')
     done()
   })
  })

})
