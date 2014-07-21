var swagger = require('swagger-node-express')
    , errors    = require('./lib/errors')
    , moment    = require('moment')
    , passport  = require('passport')
    , mongoose  = require('mongoose')
    , _         = require('underscore')
    , Piece     = mongoose.model('Piece')
    , Account   = mongoose.model('Account');

exports.get = {
  'spec': {
    'description': 'View a Product Piece',
    'path': '/piece/{id}',
    'notes': 'Get a Piece',
    'summary': 'Get a Piece',
    'method': 'GET',
    'params': [
      swagger.params.path('id', 'Piece ID', 'string')
    ],
    'responseClass': 'Piece',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Piece')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', { session: false, optional: true })
    // ],
    'nickname': 'get',
    'requestSignature': 'token'
  },
  'action': function(req, res) {

    req.assert('id', 'Invalid Object ID').isObjectID()
    if (req.validationErrors()) throw errors.invalid('input', errors)

    Piece.findOne({ _id : req.params.id })
      .exec(function(err, piece) {
        if (err || !piece)
          return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

        res.json(200, piece)
      })

  }
}

exports.delete = {
  'spec': {
    'description': 'Delete a Piece',
    'path': '/piece/{id}',
    'notes': 'Delete a Piece',
    'summary': 'Delete a Piece',
    'method': 'DELETE',
    'params': [
      swagger.params.path('id', 'Piece ID', 'string')
    ],
    'responseClass': 'Piece',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Piece')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', { session: false } )
    // ],
    'nickname': 'delete'
  },
  'action': function (req,res) {

    req.assert('id', 'Invalid Object ID').isObjectID()
    if (req.validationErrors()) throw errors.invalid('input', errors)

    Piece.load(req.params.id, function (err, piece) {
      if (err || !piece)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      Piece.remove(function (err, piece) {
        if (err)
          return res.json(err.http_code || 500, err)

        res.json(200, 'Piece Deleted')
      })
    })

  }
}

exports.put = {
  'spec': {
    'description': 'Update a Piece',
    'path': '/piece/{id}',
    'notes': 'Update Piece',
    'summary': 'Update a Piece Document. Access is restricted by ownership and role.',
    'method': 'PUT',
    'params': [
      swagger.params.path('id', 'Piece ID', 'string'),
      swagger.params.body('body', 'Body', 'Piece')
    ],
    'responseClass': 'Piece',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Piece')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', { session: false })
    // ],
    'nickname': 'update'
  },
  'action': function(req, res) {

    req.assert('id', 'Invalid Object ID').isObjectID()
    if (req.validationErrors()) throw errors.invalid('input', errors)

    var data = req.body
    if (data.body) data = req.body.body
    if (typeof data == 'string') data = JSON.parse(data)

    Piece.load(req.params.id, function (err, piece) {
      if (err || !piece)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      piece = _.extend(piece, req.body)

      if (piece.isModified()) {

        piece.save(function (err) {
          if (err)
            return res.json(err.http_code || 500, err)

          res.json(200, piece.toObject() )
        })

      } else {
        res.json(200, piece.toObject() )
      }
    })
  }
}

exports.post = {
  'spec': {
    'description': 'Create a Product Piece',
    'path': '/piece',
    'notes': 'Create a Piece',
    'summary': 'Create a Piece',
    'method': 'POST',
    'params': [
      swagger.params.body('body', 'Piece Object to create.', 'Piece' )
    ],
    'responseClass': 'Piece',
    'errorResponses': [
      errors.invalid('status')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', { session: false })
    // ],
    'nickname': 'create'
  },
  'action': function(req, res) {

    var piece = new Piece(req.body)

    piece.save(function(err) {
      if (err)
        return res.json(500, err)

      res.json(200, piece.toObject())
    })

  }
}
