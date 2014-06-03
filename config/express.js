var express = require('express')
  , pkg = require('../package.json')

var _ = require('underscore')
var coding = require('coding')

module.exports = function (app, passport) {

  app.set('views', __dirname + '/../views')
  app.set('view options', { layout: true, pretty: true })
  app.set('view engine', 'jade')

  app.use(express.logger('dev'))
  app.use(express.compress())
  app.use(express.bodyParser())
  // app.use(express.json())
  app.use(express.urlencoded())
  app.use(express.methodOverride())
  app.use(express.cookieParser('LegoJS'))
  app.use(require('./middlewares/validators').expressValidator())
  // app.use(require('./middlewares/location')(app))

  app.use(function(req, res, next) {
    // We need to allow cross-site HTTP requests so that web pages loaded from
    // other servers can make requests to us.
    // CORS middleware: http://stackoverflow.com/a/7069902

    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    next()
  })

  app.use(passport.initialize())

  app.use(function(req, res, next) {
    var url = require('url')
    var queryURL = url.parse(req.url, true)
    req.urlparams = queryURL.query
    next()
  })

  // Calls the coding module to decode the body
  // as a javascript object so non-utf8 characters
  // will be stored natively.

  app.use(function(req, res, next) {
    if (req.body)
      req.body = coding.decode(req.body)
    next()
  })

  app.use(app.router)

  /* Setup the Jade Locals */

  app.locals.moment  = require('moment')
  app.locals._       = require('underscore')
  app.locals.domain  = process.env.DOMAIN || 'api.legojs.io'
  app.locals.app     = { env: process.env.NODE_ENV, version: pkg.version }
  app.locals.basedir = require('path').join(__dirname, '/../views')

  GLOBAL.jade_basedir = require('path').join(__dirname, '/../views')

  app.use('/', express.static(require('path').join(__dirname, '/../')))

  app.use(function(req, res){
    res.render('index', { showkey: true, title: 'Home' })
  })

}
