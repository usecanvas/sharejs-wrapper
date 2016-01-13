BROWSERIFY = node_modules/.bin/browserify
JSDOC = node_modules/.bin/jsdoc

all: build

build: dist/index.js docs

dist/index.js: index.js
	rm -rf dist/
	mkdir -p dist
	$(BROWSERIFY) index.js -o dist/index.js -s ShareJSWrapper \
		-t [ babelify --presets [ es2015 ] ]

docs: index.js README.md package.json
	rm -rf docs/
	$(JSDOC) index.js -c .jsdocrc -d docs

watch:
	watchman watch $(shell pwd)
	watchman -- trigger $(shell pwd) remake 'index.js' 'README.md' 'package.json' -- make build
