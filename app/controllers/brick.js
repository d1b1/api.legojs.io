var swagger = require('swagger-node-express')
    , errors    = require('./lib/errors')
    , moment    = require('moment')
    , passport  = require('passport')
    , mongoose  = require('mongoose')
    , _         = require('underscore')
    , Brick     = mongoose.model('Brick')
    , Account   = mongoose.model('Account');

exports.search = {
  'spec': {
    'description': 'Search Bricks',
    'path': '/brick/search',
    'notes': 'Full text brick search.',
    'summary': 'Search Brick Datastore',
    'method': 'GET',
    'params': [
      // swagger.params.query('term', 'Full Text Search', 'string'),
      swagger.params.query('color', 'Name', 'string'),
      swagger.params.query('designid', 'Design ID', 'string'),
      swagger.params.query('elementid', 'Element ID', 'string'),
      swagger.params.query('price', 'Price', 'string'),
      swagger.params.query('name', 'Name', 'string'),
      swagger.params.query('category', 'Category', 'string'),
      //
      swagger.params.query('page', 'Optional - Current Page', 'string'),
      swagger.params.query('size', 'Optional - Page Size', 'string'),
      swagger.params.query('fields', 'Fields to return in the results (Required for Format = Statictics)', 'string'),
      swagger.params.query('limit', 'Limit the Results returned.', 'integer')
    ],
    'responseClass': 'Brick',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Brick')
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

    var query = Brick.find({})
    query.sort('-name')

    // Only add the limit when desired by the user.
    if (req.urlparams.limit)
      query.limit( req.urlparams.limit || 10 )

    var f = 'name,category,color,designId,elementId'
    _.each(f.split(','), function(o) {
      if (req.urlparams[o]) query.where(o).regex(new RegExp(req.urlparams[o], 'i'))
    });

    if (req.urlparams.name) query.where('name').equals(req.urlparams.name)
    if (req.urlparams.color) query.where('color').equals(req.urlparams.color)
    if (req.urlparams.cateogry) query.where('category').equals(req.urlparams.category)
    if (req.urlparams.elementid) query.where('elementId').equals(req.urlparams.elementId)
    if (req.urlparams.designId) query.where('designId').equals(req.urlparams.designid)

    var options = {
      perPage: req.urlparams.size || 10,
      delta  : 1,
      page   : req.urlparams.page > 0 ? req.urlparams.page : 0
    }

    query.lean()
    query.paginate(options, function(err, data) {
      if (err)
        return res.json(500, err)

      _.each(data.results, function(i) {
        if (_.contains(fav_ids, i._id.toString())) {
          i._user_favorite = _.find(favs, function(o) { return o.typeid.toString() == i._id.toString() })
        }
      })

      data._conditions = query._conditions
      res.json(200, data)
    })

  }
}

exports.get = {
  'spec': {
    'description': 'View a Brick',
    'path': '/brick/{id}',
    'notes': 'Get a Brick',
    'summary': 'Get a Brick',
    'method': 'GET',
    'params': [
      swagger.params.path('id', 'Brick ID', 'string')
    ],
    'responseClass': 'Brick',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Brick')
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

    Brick.findOne({ _id : req.params.id })
      .exec(function(err, brick) {
        if (err || !brick)
          return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

        res.json(200, brick)
      })

  }
}

exports.delete = {
  'spec': {
    'description': 'Delete a Brick',
    'path': '/brick/{id}',
    'notes': 'Delete a Brick',
    'summary': 'Delete a Brick',
    'method': 'DELETE',
    'params': [
      swagger.params.path('id', 'Brick ID', 'string')
    ],
    'responseClass': 'Brick',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Brick')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', { session: false } )
    // ],
    'nickname': 'delete'
  },
  'action': function (req,res) {

    req.assert('id', 'Invalid Object ID').isObjectID()
    if (req.validationErrors()) throw errors.invalid('input', errors)

    Brick.load(req.params.id, function (err, brick) {
      if (err || !brick)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      Brick.remove(function (err, brick) {
        if (err)
          return res.json(err.http_code || 500, err)

        res.json(200, 'Brick Deleted')
      })
    })

  }
}

exports.put = {
  'spec': {
    'description': 'Update a Brick',
    'path': '/brick/{id}',
    'notes': 'Update Brick',
    'summary': 'Update a Brick Document. Access is restricted by ownership and role.',
    'method': 'PUT',
    'params': [
      swagger.params.path('id', 'Brick ID', 'string'),
      swagger.params.body('body', 'Body', 'Brick' )
    ],
    'responseClass': 'Brick',
    'errorResponses': [
      errors.invalid('id'),
      errors.notFound('Brick')
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

    Brick.load(req.params.id, function (err, brick) {
      if (err || !brick)
        return res.json(err ? 500 : 404, err ? err : 'Nothing Found' )

      brick = _.extend(brick, req.body)

      if (Brick.isModified()) {

        Brick.save(req, function (err) {
          if (err)
            return res.json(err.http_code || 500, err)

          res.json(200, Brick.toObject() )
        })

      } else {
        res.json(200, Brick.toObject() )
      }
    })
  }
}

exports.post = {
  'spec': {
    'description': 'Create a Brick',
    'path': '/brick',
    'notes': 'Create a Brick',
    'summary': 'Create a Brick',
    'method': 'POST',
    'params': [
      swagger.params.body('body', 'Brick Object to create.', 'Brick' )
    ],
    'responseClass': 'Brick',
    'errorResponses': [
      errors.invalid('status')
    ],
    // 'preliminaryCallbacks': [
    //   passport.authenticate('token', { session: false })
    // ],
    'nickname': 'create'
  },
  'action': function(req, res) {

    var brick = new Brick(req.body)

    Brick.save(req, function(err) {
      if (err)
        return res.json(500, err)

      res.json(200, Brick.toObject())
    })

  }
}
