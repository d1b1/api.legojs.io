var express  = require('express')
var passport = require('passport')
var mongoose = require('mongoose')
var fs       = require('fs')

// Setup MongoDB for Mongoose
mongoose.connect(process.env.MONGOLAB_URI);

// Bootstrap models
var models_path = __dirname + '/app/models'
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})

var app = express()

require('./config/passport')(passport)
require('./config/express')(app, passport)
require('./config/routes')(app)

// Start the app by listening on <port>.
var port = process.env.PORT || 3000
app.listen(port)

console.log('Express app started on port ' + port)
