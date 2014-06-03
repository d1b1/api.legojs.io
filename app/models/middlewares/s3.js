var Blitline  = require('blitline');
var fs        = require('fs');
var knox      = require('knox');
var knoxCopy  = require('knox-copy');

// This function provides the ability to storage an image in the 
// the S3 Bucket.
store = exports.store = function(file, cb) {

  // TODO: Add AWS credtial validation
  
  if (!process.env.AWS_S3_BUCKET) {
    var err = new Error('No AWS S3 Credential Provided')
    return cb(err)
  }

  var amazon_url = 'http://s3.amazonaws.com/' + process.env.AWS_S3_BUCKET;

  var knox_params = {
      key: process.env.AWS_ACCESS_KEY_ID.toString(),
      secret: process.env.AWS_SECRET_ACCESS_KEY.toString(),
      bucket: process.env.AWS_S3_BUCKET.toString()
    };

  var client = knox.createClient(knox_params);
  var filename = (file.name).replace(/ /g, '-');

  client.putFile(file.path, 'scratch/' + filename, {'Content-Type': file.type, 'x-amz-acl': 'public-read'}, 
    function(err, result) {
      if (err) {
        return cb(err, null) 
      } else {
        if (200 == result.statusCode) { 
          // console.log('Uploaded to Amazon S3!');
          var awsData = result.socket._httpMessage;

          var smData = {
            url: awsData.url,
            filename: filename
          }

          // Send the data back to the Callback()
          cb(null, smData);

          try {

            fs.unlink(file.path, function (err) {
              if (err) throw err;
              // console.log('Removed the scratch file /' + file.path); 
            });

          } catch(err) {
            console.log('Warning: Unable to delete the tmp file.', err);
          }

        } else { 
          cb(result, null)
        }
      }
  });

}

resizer = exports.resizer = function(filename, width, height, cb) {

  var blitline = new Blitline();

  var amazon_url = 'http://s3.amazonaws.com/' + process.env.AWS_S3_BUCKET;

  var url = amazon_url + '/scratch/' + filename;
  var folder = width.toString() + 'x' + height.toString();

  var job = blitline.addJob(process.env.BLITLINE_API_KEY, url);
  job.addFunction('resize_to_fit', { width: width, height: height}, 'my_blurred_cropped_image')
    .addSave('my_image', process.env.AWS_S3_BUCKET, folder + '/' + filename.replace(/ /g, "-"));

  blitline.postJobs(function(response) {
    // Should have response, but it not really needed for poc.
    // console.log(response);

    cb(null, response);
  });

}

getURL = exports.getURL = function( job ) {

// {"results":[
//   { "images":[
//     { "image_identifier":"my_image",
//       "s3_url":"http://s3.amazonaws.com/nodeloader/100x100/afdff9f81af5630adbfe672857eed849"}
//     ],
//    "job_id":"02cks-yGGQ9TeL6673IlfKw"
//   }
// ]
// }

  var jobObj = JSON.parse(job);

  var results = jobObj.results;
  var result = results[0];
  var images = result.images;
  var image = images[0];

  console.log(image.s3_url);

  return image.s3_url;

}