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
      swagger.params.query('id', 'Product ID', 'string'),
      swagger.params.query('numOfPieces', 'Number of Pieces', 'string'),
      swagger.params.query('name', 'Name', 'string'),
      swagger.params.query('category', 'Category', 'string'),
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

    var f = 'name,category,color,designId,elementId'
    _.each(f.split(','), function(o) {
      if (req.urlparams[o]) query.where(o).regex(new RegExp(req.urlparams[o], 'i'))
    });

    if (req.urlparams.name) query.where({ name: new RegExp('^' + req.urlparams.name) })
    if (req.urlparams.color) query.where({ color: new RegExp('^' + req.urlparams.color) })

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
