// Define the Mongo Client.
var monq = require('monq')
var client = monq(process.env.MONGODB_URI, { safe: true })

exports.q = client.queue('foo')
