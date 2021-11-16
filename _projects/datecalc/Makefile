build: dist/datecalc.js dist/datecalc.test.js

dist/datecalc.js: src/datecalc.ts
	tsc --build tsconfig.json
	cp dist/datecalc.js ../../scripts/

dist/datecalc.test.js: src/datecalc.test.ts
	tsc --build tsconfig.json

test: build
	node dist/datecalc.test.js

clean:
	rm -rf dist/
