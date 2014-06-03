var Faker = require('Faker')

exports.createAccount = function() {

  var username = Faker.Internet.userName() + Faker.Helpers.randomNumber(9999)

  var data = {
    name:      Faker.Name.findName(),
    username:  username,
    email:     username + '@' + Faker.Internet.domainName() + '.test.com',
    password: '12345',
    country:   Faker.Address.ukCountry(),
    state:     Faker.Address.usState(),
    //state:     'Jane Amapá',
    city:      Faker.Address.city(),
    oauth: []
  }

  return data
}

exports.createBrick = function() {

  var data = {
    name:      'Brick ' + Faker.Name.findName(),
    source:    'Cow',
    texture:   'Soft'
  }

  return data
}

exports.createMaker = function() {

  var data = {
    name:      'Maker ' + Faker.Name.findName(),
    type:      'Maker',
    country:   Faker.Address.ukCountry(),
    state:     Faker.Address.usState(),
    city:      Faker.Address.city()
  }

  return data
}


exports.createFavorite = function(type, typeid) {

  var data = {
    rating:    'Loved it',
    type:      type,
    typeid:    typeid,
    location:  Faker.Address.city() + ', ' + Faker.Address.ukCountry(),
    note:      'Sample Description'
  }

  return data
}
