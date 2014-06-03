var api     = require('./lib/braque')
var helpers = require('./lib/helpers')
var assert  = require('assert')
var mongodb = require('mongodb')

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

describe('Brick CRUD', function(done) {

  it('should CREATE a Brick', function(done) {

    var BrickData = { name: "Brick 101" }

    api.Brick.create({ body: BrickData }, userProfile, function(err, Brick) {
      assert.ok(err==null, 'No Error')
      assert.equal(Brick.name, BrickData.name, 'Brick Name is valid')

      baseBrick = Brick
      done()
    })
  })

  it('should GET a Brick', function(done) {
    api.Brick.get({ id: baseBrick._id }, userProfile, function(err, Brick) {
      assert.ok(err==null, 'No Error')
      assert.equal(Brick.name, baseBrick.name, 'Name is valid')
      done()
    })
  })

  it('should UPDATE a Brick', function(done) {

    var BrickData = { name: "Brick 102" }

    api.Brick.update({ id: baseBrick._id, body: BrickData }, userProfile, function(err, Brick) {
      assert.ok(err==null, 'No Error')
      assert.equal(Brick.name, BrickData.name, 'Brick Name is valid')
      done()
    })
  })

  it('should DELETE a Brick', function(done) {
   api.Brick.delete({ id: baseBrick._id }, userProfile, function(err, data) {
     assert.ok(err==null, 'No Error')
     done()
   })
  })

  // ------------------------------------------------------------
  // FOO GET / UPDATE / DELETE

  it('should fail to GET a Foo Brick', function(done) {
    api.Brick.get({ id: new mongodb.ObjectID().toString()  }, userProfile, function(err, Brick) {
      assert.ok(err.code == 404)
      done()
    })
  })

  it('should fail to UPDATE a Foo Brick', function(done) {
    api.Brick.update({ id: new mongodb.ObjectID().toString(), body: {}  }, userProfile, function(err, Brick) {
      assert.ok(err.code == 404)
      done()
    })
  })

  it('should fail to DELETE a Foo Maker', function(done) {
    api.Brick.delete({ id: new mongodb.ObjectID().toString()  }, userProfile, function(err, Brick) {
      assert.ok(err.code == 404)
      done()
    })
  })

  // Test Foo Liks
  // -------------------------------------------------------------

  it('should fail to POST a Bogus Maker Link', function(done) {
    api.Brick.link({ id: new mongodb.ObjectID().toString(), body: {} }, userProfile, function(err, Brick) {
      assert.ok(err.code == 404)
      done()
    })
  })

  it('should fail to DELETE a Bogus Maker Link', function(done) {
    api.Brick.unlink({ id: new mongodb.ObjectID().toString(), body: {} }, userProfile, function(err, Brick) {
      assert.ok(err.code == 404)
      done()
    })
  })

  it('should fail to UPDATE a Bogus Maker Link', function(done) {
    api.Brick.updatelink({ id: new mongodb.ObjectID().toString(), body: {} }, userProfile, function(err, Brick) {
      assert.ok(err.code == 404)
      done()
    })
  })

})
