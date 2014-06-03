var monq = require('monq')

module.exports = function(app) {

  // Define the Mongo Client.
  var client = monq(process.env.MONGODB_URI, { safe: true })

  // Define the Worker and Queue.
  var worker = client.worker(['foo'])
  var queue = client.queue('foo')

  // Register the Workers.
  worker.register({

    imageResize: require('../app/controllers/queue/worker_image_resize'),

    // Call the Worker to handle updates that happen after we update an account.
    updateAccount: require('../app/controllers/queue/worker_updateAccount'),

    // Call the Worker to handle updates that happen after we update a brick.
    updateBrick: require('../app/controllers/queue/worker_updateBrick'),


  })

  worker.on('dequeued', function(data) {
      console.log('Dequeued:')
      console.log(data)
  })

  worker.on('failed', function(data) {
      console.log('Failed:')
      console.log(data)
  })

  worker.on('complete', function(data) {
      console.log('Complete:')
      console.log(data)
  })

  worker.on('error', function(err) {
      console.log('Error:')
      console.log(err)
      worker.stop()
  })

  console.log('Starting Worker')
  worker.start()
}
