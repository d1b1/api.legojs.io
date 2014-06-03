var Mocha = require('mocha'),
    fs    = require('fs'),
    path  = require('path')
    app   = require('./test/lib/app'),
    argv  = require('optimist').argv,
    fs    = require('fs')

// First, you need to instantiate a Mocha instance.
var mocha = new Mocha({
    reporter: 'spec'
})

// Then, you need to use the method "addFile" on the mocha
// object for each file.

if (argv.file) {

  if (fs.existsSync( argv.file )) {
    mocha.addFile( argv.file )
  } else {
    console.log('Test file was not found in the test folder.')
    process.exit(1)
  }

} else {

  // Here is an example:
  fs.readdirSync('test').filter(function(file) {
    // Only keep the .js files
    return file.substr(-3) === '.js'
  }).forEach(function(file){
    // Use the method "addFile" to add the file to mocha
    mocha.addFile( path.join('test', file) )
  })

}

Server = app.listen(3000, function (err, result) {
  if (err) {
    console.log('Failed')
  } else {
    // Now, you can run the tests.
    mocha.run(function(failures) {

      console.log('Failures', failures)
      process.exit(failures)
    })
  }

})
