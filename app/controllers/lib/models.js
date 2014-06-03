exports.models = {
     "TokenRequest":{
      "id": "TokenRequest",
      "properties":{
        "username": {
          "type": "string",
          "required": true
        },
        "password": {
          "type": "string",
          "required": true
        }
      }
    },
    "Brick":{
       "id": "Brick",
       "properties":{
         "name": {
           "type": "string",
           "required": true
         },
         "price": {
           "type": "string",
           "required": true
         },
         "color": {
           "type": "string",
           "required": true
         },
         "elementId": {
           "type": "string",
           "required": true
         },
         "designId": {
           "type": "string",
           "required": true
         },
         "category": {
           "type": "string",
           "required": false
         }
       }
    },
    "User":{
      "id": "User",
      "properties":{
        "user": {
          "type": "string",
          "required": true
        },
        "username": {
          "type": "string",
          "required": true
        },
        "password": {
          "type": "string",
          "required": false
        },
        "name": {
          "type": "string",
          "required": true
        },
        "city": {
          "type": "string",
          "required": true
        },
        "state": {
          "type": "string",
          "required": true
        },
        "country": {
          "type": "string",
          "required": true
        },
        "email": {
          "type": "string",
          "required": true
        },
        "created": {
          "type": "string",
          "required": false
        },
        "modified": {
          "type": "string",
          "required": false
        },
        "photo": {
          "type": "string",
          "required": false
        },
        // Array of OAuth Provider Info.
        "oauth":{
          "items":{
            "$ref": "Provider"
          },
          "type": "Array"
        },
      }
    },
    "Provider":{
      "id": "Provider",
      "properties":{
        "provider": {
          "type": "string",
          "required": true,
          "description": "OAuth Provider: Twitter, Github, Gmail Facebook."
        },
        "id": {
          "type": "string",
          "required": true,
          "description": "Provider Primary User ID. Used by Loggin to look an account."
        },
        "date_authorized": {
          "type": "string",
          "required": false,
          "description": "Date the OAuth Link was established."
        },
        "token": {
          "type": "string",
          "required": false,
          "description": "OAuth Access Token Key."
        },
        "secret": {
          "type": "string",
          "required": false,
          "description": "OAuth Access Token Secret."
        },
        "data": {
          "type": "string",
          "required": false,
          "description": "JSON Object with all data from the Provider for the account."
        }
      }
    }
  }
