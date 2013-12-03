
test:
	./node_modules/.bin/mocha \
		--reporter list \
		--timeout 1000 \
		-u tdd \
		test/*.js

debug:
	node debug ./node_modules/.bin/_mocha \
		--reporter list \
		--timeout 1000 \
		-u tdd \
		test/*.js 

.PHONY: test
