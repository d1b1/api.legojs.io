var api    = require('./lib/braque')
var assert = require('assert')
var Faker  = require('Faker')
var _      = require('underscore')
var helpers = require('./lib/helpers')

// Update to create bricks and test the search options

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

var baseBrick = {}
var baseMaker = {}
var baseAccount = {}

var brickData = null
var makerData = null
var accountData = null

describe('Brick Statistics/Distinct', function(done) {

  it('should create ', function(done) {

    brickData = { name: 'Brick ' + Faker.Name.firstName(), texture: 'Soft', source: 'Special' + Faker.Helpers.randomNumber(9999) }

    api.brick.create({ body: brickData }, userProfile, function(err, brick) {
      assert.ok(err==null, 'No Error')
      assert.equal(brick.name, brickData.name, 'Brick Name is valid')

      baseBrick = brick
      done()
    })

  })

  it('should report statistics value', function(done) {

    var opts = {
      fields: 'source',
      format: 'statistics',
    }

    api.brick.search(opts, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')

      var hasId = _.find(results, function(o) {
        return o.value == brickData.source
      })

      assert.ok( !_.isUndefined(hasId) )
      done()
    })
  })

  it('should report statistics texture', function(done) {

    var opts = { fields: 'texture', format: 'statistics' }

    api.brick.search(opts, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')

      var hasId = _.find(results, function(o) {
        return o.value == baseBrick.texture
      })

      assert.ok( !_.isUndefined(hasId) )
      done()
    })
  })

  it('should report distinct value', function(done) {

    // Hint: After creating the brick with a specific
    // source string, we expect the distint to return
    // that value when we define the distinct on the
    // same fields and provider a condition that would
    // result in a single brick to return.

    var opts = {
      fields: 'source',
      format: 'distinct',
      source: brickData.source
    }

    api.brick.search(opts, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.equal( results.length, 1, 'Found a single unique string' )
      assert.equal( _.first(results), brickData.source, 'Found a single unique string')
      done()
    })
  })

  it('should delete', function(done) {
   api.brick.delete({ id: baseBrick._id }, userProfile, function(err, data) {
     assert.ok(err==null, 'No Error')
     done()
   })
  })

})

describe('Maker Statistics/Distinct', function(done) {

  it('should create ', function(done) {

    makerData = { name: 'Maker ' + Faker.Name.firstName(), type: 'Special' + Faker.Helpers.randomNumber(9999) }

    api.maker.create({ body: makerData }, userProfile, function(err, maker) {
      assert.ok(err==null, 'No Error')
      assert.equal(maker.name, makerData.name, 'Maker Name is valid')

      baseMaker = maker
      done()
    })

  })

  it('should report statistics value', function(done) {

    var opts = {
      fields: 'type',
      format: 'statistics',
    }

    api.maker.search(opts, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')

      var hasId = _.find(results, function(o) { return o.value == makerData.type })

      assert.ok( !_.isUndefined(hasId) )
      // if (hasId)
      //   assert.equal( hasId.value, 1, 'Found a Source Value')

      done()
    })
  })

  it('should report distinct value', function(done) {

    // Hint: After creating the brick with a specific
    // source string, we expect the distint to return
    // that value when we define the distinct on the
    // same fields and provider a condition that would
    // result in a single brick to return.

    var opts = {
      fields: 'type',
      format: 'distinct',
      type: makerData.type
    }

    api.maker.search(opts, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.equal( results.length, 1, 'Found a single unique string' )
      assert.equal( _.first(results), makerData.type, 'Found a single unique string')
      done()
    })
  })

  it('should delete', function(done) {
   api.maker.delete({ id: baseMaker._id }, userProfile, function(err, data) {
     assert.ok(err==null, 'No Error')
     done()
   })
  })

})

describe('Account Statistics/Distinct', function(done) {

  it('should CREATE an account', function(done) {

    accountData = helpers.createAccount()

    api.user.create({ body: accountData }, userProfile, function(err, account) {
      if (err) console.log('Error', err)
      assert.ok(err==null, 'No Error')
      assert.equal(account.username, accountData.username, 'Username is valid')

      baseAccount = account
      done()
    })
  })

  it('should report statistics value', function(done) {

    var opts = {
      fields: 'username',
      format: 'statistics',
    }

    api.user.search(opts, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      var hasId = _.find(results, function(o) { return o.value == accountData.username })

      assert.ok( !_.isUndefined(hasId) )
      // if (hasId)
      //   assert.equal( hasId.value, 1, 'Found a Source Value')

      done()
    })
  })

  it('should report distinct value', function(done) {

    var opts = {
      fields: 'country',
      format: 'distinct',
      country: accountData.country
    }

    api.user.search(opts, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.equal( results.length, 1, 'Found a single unique string' )
      assert.equal( _.first(results), accountData.country, 'Found a single unique string')
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
