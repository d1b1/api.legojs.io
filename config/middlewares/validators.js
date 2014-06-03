var expressValidator = require('express-validator');

expressValidator.Validator.prototype.isObjectID = function() {
  var regex = new RegExp("^[0-9a-fA-F]{24}$");
  if (!regex.test(this.str)) {
    this.error(this.msg + ", Requires a String of 12 bytes or a string of 24 hex characters.");
  }
  return this; //Allow method chaining
}

exports.expressValidator = expressValidator;

