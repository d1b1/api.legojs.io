/* Dependencies */

var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , _ = require('underscore');

/* Plugins */

var mongoosastic = require('mongoosastic')
var createdModifiedPlugin = require('mongoose-createdmodified').createdModifiedPlugin

/* Schemas */

var brickSchema = new Schema({
  brickId:         { type: String, true: true, index: true },
  name:            { type: String, required: true, index: true },
  designId:        { type: String, index: true },
  elementId:       { type: String, index: true },
  familyColor:     { type: String, index: true },
  exactColor:      { type: String, index: true },
  category:        { type: String, index: true },
  price:           { type: String, index: true },
  image:           { type: String }

}, { collection: 'brick' })

brickSchema.plugin(createdModifiedPlugin, {index: true})

/* Virtuals */

/* Validations */

brickSchema.path('name').validate(function (name) {
  return name.length
}, 'Name cannot be blank')

/* Pre-save hook */

/* Post-save hook */

/* Methods */

brickSchema.methods = {
  // storeImage: function(model, file, req, cb) {
  //
  //   S3.store(file, function(err, image) {
  //     if (err)
  //       return cb(err)
  //
  //     // Set the fields we are updating.
  //     model.image = image.url
  //     model.main_image.raw = image.url
  //
  //     model.save(req, function(err) {
  //       cb(null, image)
  //     })
  //
  //   })
  // }
}

brickSchema.statics = {
  load: function (id, cb) {
    this.findOne({ _id : id })
      .exec(cb)
  }
}

/* Elastic Search */

// var connectionString = require('url').parse(process.env.SEARCHBOX_URL)
//
// brickSchema.plugin(mongoosastic, {
//   index: 'legojs-mongoose',
//   port: 80,
//   host: connectionString.auth + '@' + connectionString.hostname
// })

mongoose.model('Brick', brickSchema)
