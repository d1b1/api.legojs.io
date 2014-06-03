REPORTER = spec

test:
	 @NODE_ENV=test ./node_modules/.bin/mocha -b --reporter $(REPORTER)

local:
	 ## This calls a local setup file that uses Staging resources.
	 foreman start -f Procfile.dev --port 3000

coverage:
	 ./node_modules/.bin/istanbul cover ./mocha.js
	 cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js

## export MONGOLAB_URI2="mongodb://localhost:27017/legojs"; \
## export API_URL=api.legojs.io; \

local:
	 export MONGOLAB_URI=mongodb://heroku_app25976424:nkvrijf79189kf8c36j5podtg4@ds041168.mongolab.com:41168/heroku_app25976424; \
	 nodemon server.js

.PHONY: test
