/* Dependencies */

var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , _ = require('underscore');

/* Plugins */

var mongoosastic = require('mongoosastic')
var createdModifiedPlugin = require('mongoose-createdmodified').createdModifiedPlugin

/* Schemas */

var pieceSchema = new Schema({
  count:        { type: Number, default: 0 },
  brick:        { type: Schema.Types.ObjectId, ref: 'Brick', required: true }
})

var productSchema = new Schema({
  name:            { type: String, required: true, index: true },
  productId:       { type: String, true: true, index: true },
  pdf_Url:         [ String ],
  theme:           [ String ],
  themeCode:       { type: String, index: true },
  year:            { type: String, index: true },
  version:         { type: String, index: true },
  numOfPieces:     { type: String },
  image:           { type: String },
  manifest:        [ pieceSchema ]
}, { collection: 'product' })

productSchema.plugin(createdModifiedPlugin, {index: true})

/* Virtuals */

/* Validations */

productSchema.path('name').validate(function (name) {
  return name.length
}, 'Name cannot be blank')

/* Pre-save hook */

/* Post-save hook */

/* Methods */

productSchema.methods = {
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

productSchema.statics = {
  load: function (id, cb) {
    this.findOne({ _id : id })
      .exec(cb)
  }
}

/* Elastic Search */

// var connectionString = require('url').parse(process.env.SEARCHBOX_URL)
//
// productSchema.plugin(mongoosastic, {
//   index: 'legojs-mongoose',
//   port: 80,
//   host: connectionString.auth + '@' + connectionString.hostname
// })

mongoose.model('Product', productSchema)
