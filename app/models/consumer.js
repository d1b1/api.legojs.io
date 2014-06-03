/* Dependencies */

var mongoose = require('mongoose')
    , _ = require('underscore')

/* Plugins */

var createdModifiedPlugin = require('mongoose-createdmodified').createdModifiedPlugin

/* Schema */

var ConsumerSchema = new mongoose.Schema({
  name:            { type: String }, 
  consumerSecret:  { type: String },
  consumerKey:     { type: String }
}, { collection: 'consumers' })

// ConsumerSchema.plugin(createdModifiedPlugin, {index: true})

/* Validations */

/* Post-save hook */

/* Methods */

ConsumerSchema.statics = {

  /*
   * Find by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function(id, cb) {
    this.findOne({ _id : id }).exec(cb)
  },

  findByKey: function(consumerKey, cb) {
    this.findOne({ consumerKey: consumerKey })
      .exec(function(err, doc) {
        cb(err, _.omit(doc, '_id'))
      })
  },

  loadExistingConsumer: function(consumerKey, cb) {
    this.findOne({ consumerKey: consumerKey }).select('-_id').exec(cb)
      // .exec(function(err, doc) {
      //   cb(err, _.omit(doc, '_id'))
      // })
  }

}

mongoose.model('Consumer', ConsumerSchema)