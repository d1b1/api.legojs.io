var swagger = require('swagger-node-express')
    , errors    = require('./lib/errors')
    , moment    = require('moment')
    , passport  = require('passport')
    , mongoose  = require('mongoose')
    , _         = require('underscore')
    , Product   = mongoose.model('Product')
    , Account   = mongoose.model('Account');

exports.search = {
  'spec': {
    'description': 'Search Products',
    'path': '/product/search',
    'notes': 'Full text Product search.',
    'summary': 'Search Product Datastore',
    'method': 'GET',
    'params': [
      swagger.params.query('productId', 'Product ID', 'string'),
      swagger.params.query('numOfPieces', 'Number of Pieces', 'string'),
      swagger.params.query('name', 'Name', 'string'),
      swagger.params.query('theme', 'Theme Name', 'string'),
      swagger.params.query('themeCode', 'Theme Code', 'string'),
      //
      swagger.params.query('page', 'Optional - Current Page', 'string'),
      swagger.params.query('size', 'Optional - Page Size', 'string'),
      swagger.params.query('fields', 'Fields to return in the results (Required for Format = Statictics)', 'string'),
      swagger.params.query('limit', 'Limit the Results returned.', 'integer')
    ],
    'responseClass': 'Product',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Product')
    ],
    // No Auth Needed. The optional setting allow the Token Strategy to
    // be bypassed. Using the Optional flag to allow tokens if available.
    // but also allow without.

    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', { optional: true, session: false})
    // ],
    'nickname': 'search'
  },
  'action': function (req, res) {

    var query = Product.find({})
    query.sort('-name')

    // Only add the limit when desired by the user.
    if (req.urlparams.limit)
      query.limit( req.urlparams.limit || 10 )

    var f = 'name,pdf_Url,productId'
    _.each(f.split(','), function(o) {
      if (req.urlparams[o]) query.where(o).regex(new RegExp(req.urlparams[o], 'i'))
    });

    if (req.urlparams.productId) query.where({ productId: req.urlparams.productId })
    if (req.urlparams.name) query.where({ name: new RegExp('^' + req.urlparams.name) })
    if (req.urlparams.theme) query.where({ theme: new RegExp('^' + req.urlparams.theme) })
    if (req.urlparams.themeCode) query.where({ themeCode: new RegExp('^' + req.urlparams.themeCode) })

    var options = {
      perPage: req.urlparams.size || 10,
      delta  : 1,
      page   : req.urlparams.page > 0 ? req.urlparams.page : 0
    }

    query.lean();
    query.paginate(options, function(err, data) {
      if (err)
        return res.json(500, err)

      data._conditions = query._conditions
      res.json(200, data)
    });

  }
}

exports.get = {
  'spec': {
    'description': 'View a Product',
    'path': '/product/{id}',
    'notes': 'Get a Product',
    'summary': 'Get a Product',
    'method': 'GET',
    'params': [
      swagger.params.path('id', 'Product ID', 'string')
    ],
    'responseClass': 'Product',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Product')
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

    Product.findOne({ _id : req.params.id })
      .exec(function(err, product) {
        if (err || !product)
          return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

        res.json(200, product)
      })

  }
}

exports.delete = {
  'spec': {
    'description': 'Delete a Product',
    'path': '/product/{id}',
    'notes': 'Delete a Product',
    'summary': 'Delete a Product',
    'method': 'DELETE',
    'params': [
      swagger.params.path('id', 'Product ID', 'string')
    ],
    'responseClass': 'Product',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Product')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', { session: false } )
    // ],
    'nickname': 'delete'
  },
  'action': function (req,res) {

    req.assert('id', 'Invalid Object ID').isObjectID()
    if (req.validationErrors()) throw errors.invalid('input', errors)

    Product.load(req.params.id, function (err, product) {
      if (err || !product)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      Product.remove(function (err, product) {
        if (err)
          return res.json(err.http_code || 500, err)

        res.json(200, 'Product Deleted')
      })
    })

  }
}

exports.put = {
  'spec': {
    'description': 'Update a Product',
    'path': '/product/{id}',
    'notes': 'Update Product',
    'summary': 'Update a Product Document. Access is restricted by ownership and role.',
    'method': 'PUT',
    'params': [
      swagger.params.path('id', 'Product ID', 'string'),
      swagger.params.body('body', 'Body', 'Product')
    ],
    'responseClass': 'Product',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Product')
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

    Product.load(req.params.id, function (err, product) {
      if (err || !product)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      product = _.extend(product, req.body)

      if (product.isModified()) {

        product.save(function (err) {
          if (err)
            return res.json(err.http_code || 500, err)

          res.json(200, product.toObject() )
        })

      } else {
        res.json(200, product.toObject() )
      }
    })
  }
}

exports.post = {
  'spec': {
    'description': 'Create a Product',
    'path': '/product',
    'notes': 'Create a Product',
    'summary': 'Create a Product',
    'method': 'POST',
    'params': [
      swagger.params.body('body', 'Product Object to create.', 'Product' )
    ],
    'responseClass': 'Product',
    'errorResponses': [
      errors.invalid('status')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', { session: false })
    // ],
    'nickname': 'create'
  },
  'action': function(req, res) {

    var product = new Product(req.body)

    product.save(function(err) {
      if (err)
        return res.json(500, err)

      res.json(200, product.toObject())
    })

  }
}

exports.pieces = {
  'spec': {
    'description': 'Product Pieces',
    'path': '/product/{id}/pieces',
    'notes': 'Get all product pieces.',
    'summary': 'Get Product Pieces',
    'method': 'GET',
    'params': [
      swagger.params.path('id', 'Product ID', 'string')
    ],
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Product')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', {session: false})
    // ],
    'nickname': 'pieces'
  },
  'action': function (req, res) {

    req.assert('id', 'Invalid Product ID').isObjectID()
    if (req.validationErrors()) throw swagger.params.invalid('input', errors)

    Product.findOne({ _id : req.params.id }).populate('manifest.brick')
      .exec(function(err, product) {
        if (err || !product)
          return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

        res.json(200, product)
      })
  }
}

exports.addPiece = {
  'spec': {
    'description': 'Add a Piece',
    'path': '/product/{id}/piece',
    'notes': 'Adds a piece to a product.',
    'summary': 'Associate a link',
    'method': 'POST',
    'params': [
      swagger.params.path('id', 'Product ID', 'string'),
      swagger.params.body('body', 'Piece Data', 'string')
    ],
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Product')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', {session: false})
    // ],
    'nickname': 'addPiece'
  },
  'action': function (req, res) {

    req.assert('id', 'Invalid Product ID').isObjectID()
    if (req.validationErrors()) throw swagger.params.invalid('input', errors)

    Product.load(req.params.id, function(err, product) {
      if (err || !product)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      var piece = _.find(product['manifest'], function(o) { return o.brick.toString() == req.body.brick })

      // If the brick is already in the product then return the piece. We do not allow
      // duplicates.
      if (piece) {
        return res.json(200, piece);
      }

      var piece = product.manifest.create(req.body);
      product.manifest.push(piece)

      product.save(req, function(err) {
        if (err)
          return res.json(err.http_code || 500, err)

        return res.json(200, piece)
      })
    })
  }
}

exports.removePiece = {
  'spec': {
    'description': 'Remove a Product Piece',
    'path': '/product/{id}/piece/{brickid}',
    'notes': 'Remove a piece from a product.',
    'summary': 'Remove a Product Piece',
    'method': 'DELETE',
    'params': [
      swagger.params.path('id', 'Product ID', 'string'),
      swagger.params.path('brickid', 'Piece/Brick ID', 'string')
    ],
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Product')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', {session: false })
    // ],
    'nickname': 'removePiece'
  },
  'action': function (req, res) {

    req.assert('id', 'Invalid Product ID').isObjectID()
    if (req.validationErrors()) throw swagger.params.invalid('input', errors)

    Product.load(req.params.id, function(err, product) {
      if (err || !product)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      // First look for a brick that the Id.
      var piece = _.find(product['manifest'], function(o) { return o.brick.toString() == req.params.brickid })

      // Second look for a piece Ids with the id.
      if (!piece)
        var piece = _.find(product['manifest'], function(o) { return o._id.toString() == req.params.brickid })

      if (piece) product['manifest'].id(piece._id.toString()).remove()

      if (!product.isModified())
        return res.json(404, 'Brick cound not be found in manifest.')

      if (product.isModified()) {
        product.save(req, function(err) {
          if (err)
            return res.json(err.http_code || 500, err)

          return res.json(200, 'Brick Removed from Product.')
        })
      }

    })

  }
}

exports.updatePiece = {
  'spec': {
    'description': 'Update a Product Piece',
    'path': '/product/{id}/piece',
    'notes': 'Update a Product Piece.',
    'summary': 'Update Product Piece',
    'method': 'PUT',
    'params': [
      swagger.params.path('id', 'Product ID', 'string'),
      // swagger.params.path('brickid', 'Brick ID', 'string'),
      swagger.params.body('body', 'Piece to Update', 'string')
    ],
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Product')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', {session: false})
    // ],
    'nickname': 'updatePiece'
  },
  'action': function(req, res) {

    req.assert('id', 'Invalid Object ID').isObjectID()
    if (req.validationErrors()) throw swagger.params.invalid('input', errors)

    Product.load(req.params.id, function(err, product) {
      if (err || !product)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      // First check by piece Id
      var piece = _.find(product['manifest'], function(o) { return o._id.toString() == req.body.brick })

      // Second check by Brick Id.
      if (!piece) {
        var piece = _.find(product['manifest'], function(o) { return o.brick.toString() == req.body.brick })
      }

      if (piece) {
         var piece = product.manifest.id(piece._id.toString())
         piece = _.extend(piece, req.body)
      }

      if (product.isModified()) {
        product.save(function(err) {
          if (err)
            return res.json(err.http_code || 500, err)
          return res.json(200, piece)
        })
      } else
        return res.json(200, piece)
    })

  }
}

exports.getPiece = {
  'spec': {
    'description': 'Get a Product Piece',
    'path': '/product/{id}/piece/{brickid}',
    'notes': 'Get a Product Piece',
    'summary': 'Get a Product Piece',
    'method': 'GET',
    'params': [
      swagger.params.path('id', 'Product ID', 'string'),
      swagger.params.path('brickid', 'Piece/Brick ID', 'string')
    ],
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Product')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', {session: false })
    // ],
    'nickname': 'removePiece'
  },
  'action': function (req, res) {

    req.assert('id', 'Invalid Product ID').isObjectID()
    if (req.validationErrors()) throw swagger.params.invalid('input', errors)

    Product.findOne({ _id : req.params.id }).populate('manifest.brick')
      .exec(function(err, product) {
        if (err || !product)
          return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

        // First look for a brick that the Id.
        var piece = _.find(product['manifest'], function(o) {
          if (o.brick && o.brick._id) {
            return o.brick._id.toString() == req.params.brickid;
          }
        })

        // Second look for a piece Ids with the id.
        if (!piece) {
          var piece = _.find(product['manifest'], function(o) {
            if (o.brick && o.brick._id) {
              return o.brick._id.toString() == req.params.brickid;
            }
          });
        }

        return res.json(200, 'Brick Removed from Product.')

        res.json(200, product);
      })

  }
}
