BROWSERIFY = node_modules/.bin/browserify
UGLIFY = node_modules/.bin/uglifyjs
JSDOC = node_modules/.bin/jsdoc

all: build

build: dist/index.js dist/index.min.js docs

dist/index.js: index.js
	rm -rf dist/
	mkdir -p dist
	$(BROWSERIFY) -u './doc' -u './query' -u './emitter'  -u '../types' \
		-u './connection' -u './textarea' -u './text-api' -u './text-tp2-api' \
		-u './json0' -u './bootstrapTransform' -u './text0' -u './text-tp2' \
		-u './text' -u './api' index.js -s ShareJSWrapper \
		-t [ babelify --presets [ es2015 ] ] | $(UGLIFY) --beautify > dist/index.js

dist/index.min.js: dist/index.js
	$(UGLIFY) dist/index.js -o dist/index.min.js

docs: index.js README.md package.json
	rm -rf docs/
	$(JSDOC) index.js -c .jsdocrc -d docs

watch:
	watchman-make -p index.js README.md package.json -t build
