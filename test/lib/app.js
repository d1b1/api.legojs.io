var express  = require('express')
var passport = require('passport')
var mongoose = require('mongoose')
var fs       = require('fs')

process.env.MONGODB_URI=""
process.env.SEARCHBOX_URL=""

process.env.AWS_ACCESS_KEY_ID=""
process.env.AWS_S3_BUCKET=""
process.env.AWS_SECRET_ACCESS_KEY=""

mongoose.connect(process.env.MONGODB_URI)

var basePath = require('path').join(__dirname, '/../..')
var models_path = require('path').join(__dirname, '/../../app/models')

// Bootstrap models
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})

var app = express()

require(basePath + '/config/passport')(passport)
require(basePath + '/config/express')(app, passport)
require(basePath + '/config/routes')(app, 'utility')

// DO not start the worker. it will impact tests.
// require(basePath + '/config/workers')(app)

module.exports = app
