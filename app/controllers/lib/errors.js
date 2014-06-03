
exports.notFound = function(field, res) { 
  if (!res) { 
    return {'code': 404, 'reason': field + ' not found'}
  } else { 
    res.send({'code': 404, 'reason': field + ' not found'}, 404) }
}

exports.invalid = function(field, res, errors) { 
  if (!res) { 
    return {'code': 400, 'reason': 'invalid ' + field, 'errors': (errors ? errors : [])} 
  } else { 
    res.send({'code': 400, 'reason': 'invalid ' + field}, 404) }
}

exports.forbidden = function(res) {
  if (!res) { 
    return {'code': 403, 'reason': 'forbidden' }
  } else { 
    res.send({'code': 403, 'reason': 'forbidden'}, 403) }
}

exports.oops = function(msg, res) {
  if (!res) { 
    return {'code': 500, 'reason': 'server error ' + msg }
  } else { 
    res.send({'code': 500, 'reason': 'server error ' + msg}, 500) }
}