// Express Middleware Plugin
var mongoose = require('mongoose')
var IPAddress = mongoose.model('IPAddress')

module.exports = function(app) {

  return function(req, res, next) {

    // Ignore if the favicon.
	if (req.url == '/favicon.ico') 
      return next()

    // TODO: Prevent lookup on other calls.

    if (!req.session) 
    	req.session = {}

    // First check if its in session.
	if (req.ression && req.session.location) {
	  app.locals.location = req.session.location;
      return next()
	}

    // Second check if we have a cookie defined.
	if (req.cookies.location) {
	  var loc = JSON.parse(req.cookies.location)

      // Update Session
	  req.session.location = {
	  	source: 'cookie',
	    result: {
	      longitude:   loc.lng,
	      latitude:    loc.lat,
	      countryCode: loc.address,
	      countryName: loc.address,
	      regionName:  ''
	    }
	  }

	  app.locals.location = req.session.location
	  next()
	}

    // Third, go to the cache and or lookup the current IP.

	// Get the IPAddress from the Proxy, if not provided, then the remote.
	var ipAddress = req.header('x-forwarded-for') || req.connection.remoteAddress

    ipAddress = ( ipAddress != '127.0.0.1') ? ipAddress : '71.234.112.59'

	IPAddress.byIPAddress(ipAddress, function(err, loc) {
	  if (err || !loc)
	    return next()

      req.session.location = loc
	  app.locals.location = loc
	  return next()
	})
		
  }
}

