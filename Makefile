.PHONY: all

BROWSERIFY = node_modules/.bin/browserify
JSDOC = node_modules/.bin/jsdoc

all: build

build: browserify docs

browserify: clean
	$(BROWSERIFY) index.js -o dist/index.js -s ShareJSWrapper \
		-t [ babelify --presets [ es2015 ] ]

docs: clean
	$(JSDOC) index.js -c .jsdocrc -d docs

clean:
	rm -rf docs/
	rm -rf dist/
	mkdir dist
