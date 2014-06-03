var http = require('http')
var _ = require('underscore')

exports.fromAddress = fromAddress = function(str, cb) {

  if (_.isArray(str)) {
    str = _.map(str, function(o) { return o.split(' ').join('+') }).join('+')
  } else {
    str = str.split(' ').join('+')
  }

  var options = {
    host: 'maps.googleapis.com',
    port: 80,
    path: '/maps/api/geocode/json?sensor=true&address=' + str
  }

  httpGET(options, function(err, data) {
    var location = null

    if (data.results && data.results.length > 0) {
      var geometry = data.results[0].geometry
      location = geometry.location
      location.meta = str
    }

    cb(null, location)
  })

}

var httpGET = function(opts, cb) {

  var call = http.request(opts, function(result) {

    result.setEncoding('utf8')
    var chunkData = ''

    result.on('data', function(chunk) { 
      chunkData = chunkData + chunk
    })

    result.on('end', function() {
      if (result.statusCode == 404) return cb(null, null);
      if (result.statusCode == 500) return cb({ message: 'Error accessing this information' }, null);

      var data = JSON.parse(chunkData);
      cb(null, data);
    })
  })

  call.on('error', function(err) { 
    console.log(err)
    cb(err, null)
  })

  call.end()

}
