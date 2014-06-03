
var swagger      = require('swagger-node-express')
    , package    = require('../package')
    , _          = require('underscore')
    , moment     = require('moment')

module.exports = function(app, excluded) {

  swagger.setAppHandler(app)

  var api = require('../app/controllers')
  var models = require('../app/controllers/lib/models')

  var modelAdder = swagger.addModels(models)
  var excludedEndpointNames = excluded ? excluded.split(',') : []

  if (!_.isEmpty(excludedEndpointNames))
    console.log('Excluding Collections: ', excludedEndpointNames)

  _.each(api,
    function addEndpoints(endpointCollection, collectionName) {

      // This will prevent the loading of specific collection names
      if (_.contains(excludedEndpointNames, collectionName)) return

      if (collectionName === 'models') return

      _.each(endpointCollection,
        function addEndpoint(endpoint, name) {
          switch (endpoint.spec.method) {
            case 'GET':
              modelAdder.addGet(endpoint)
              break
            case 'POST':
              modelAdder.addPost(endpoint)
              break
            case 'PUT':
              modelAdder.addPut(endpoint)
              break
            case 'DELETE':
              modelAdder.addDelete(endpoint)
              break
          }
        })
  })

  // Set the Swagger API static folders, And the default URL path.
  swagger.configureSwaggerPaths('', '/api-docs', '')
  swagger.configure('/', package.version + ' as of ' + moment().format('MM/DD/YY') )

}
