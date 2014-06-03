var api    = require('./lib/braque')
var assert = require('assert')
var Faker  = require('Faker')
var _      = require('underscore')

// Update to create Bricks and test the search options

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

describe('Brick Search', function(done) {

  it('should create ', function(done) {

    var BrickData = { name: 'Brick ' + Faker.Name.firstName(), category: 'Soft' }

    api.Brick.create({ body: BrickData }, userProfile, function(err, Brick) {
      assert.ok(err==null, 'No Error')
      assert.equal(Brick.name, BrickData.name, 'Brick Name is valid')

      baseBrick = Brick
      done()
    })

  })

  it('should search by name', function(done) {
    api.Brick.search({ name: baseBrick.name }, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.equal(results.count, 1, 'Found a single Brick')
      assert.equal( _.first(results.results)._id, baseBrick._id, 'Found the Specific Brick')
      done()
    })
  })

  it('should search by name & source', function(done) {
    api.Brick.search({ name: baseBrick.name, source: baseBrick.source }, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.equal(results.count, 1, 'Found a single Brick')
      assert.equal( _.first(results.results)._id, baseBrick._id, 'Found the Specific Brick')
      done()
    })
  })

  it('should search by name, source & texture', function(done) {
    api.Brick.search({ name: baseBrick.name, texture: baseBrick.texture, source: baseBrick.source }, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.equal(results.count, 1, 'Found a single Brick')
      assert.equal( _.first(results.results)._id, baseBrick._id, 'Found the Specific Brick')
      done()
    })
  })

  it('should search FREE Text', function(done) {

    var opts = { term: baseBrick.texture }

    api.Brick.search(opts, userProfile, function(err, results) {
      assert.ok(err==null, 'No Error')
      assert.ok(results.total > 0, 'Found Search Results')
      done()
    })
  })

  it('should delete', function(done) {
   api.Brick.delete({ id: baseBrick._id }, userProfile, function(err, data) {
     assert.ok(err==null, 'No Error')
     done()
   })
  })

})
