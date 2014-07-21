/* Dependencies */
/* OLD we other model (Product Handls this. might need to remove) */

var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , _ = require('underscore');

/* Plugins */

var mongoosastic = require('mongoosastic')
var createdModifiedPlugin = require('mongoose-createdmodified').createdModifiedPlugin

/* Schemas */

var pieceSchema = new Schema({
  brickId:         { type: Schema.Types.ObjectId, ref: 'Brick' },
  productId:       { type: Schema.Types.ObjectId, ref: 'Product' },
  count:           { type: Number  },
}, { collection: 'piece' })

pieceSchema.plugin(createdModifiedPlugin, {index: true})

/* Virtuals */

/* Validations */

// pieceSchema.path('name').validate(function (name) {
//   return name.length
// }, 'Name cannot be blank')

/* Pre-save hook */

/* Post-save hook */

/* Methods */

pieceSchema.methods = {
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

pieceSchema.statics = {
  load: function (id, cb) {
    this.findOne({ _id : id })
      .exec(cb)
  }
}

/* Elastic Search */

// var connectionString = require('url').parse(process.env.SEARCHBOX_URL)
//
// pieceSchema.plugin(mongoosastic, {
//   index: 'legojs-mongoose',
//   port: 80,
//   host: connectionString.auth + '@' + connectionString.hostname
// })

mongoose.model('Piece', pieceSchema)
