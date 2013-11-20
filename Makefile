
test:
	./node_modules/.bin/mocha \
		--reporter list \
		--timeout 1000 \
		-u bdd \
		test/*.js

.PHONY: test
