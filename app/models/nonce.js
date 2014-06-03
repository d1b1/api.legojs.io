var mongoose = require('mongoose')
    , _ = require('underscore')

/* Plugins */

/* Schema */

var NonceSchema = new mongoose.Schema({
  none:            { type: String }, 
  timestamp:       { type: String }
}, { collection: 'nonceTimestampPairs' })

/* Validations */

/* Post-save hook */

/* Methods */

NonceSchema.statics = {

  /*
   * Find by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   * 
   */

  load: function (id, cb) {
    this.findOne({ _id : id }).exec(cb)
  }

}

mongoose.model('Nonce', NonceSchema)