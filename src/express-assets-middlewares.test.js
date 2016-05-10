'use strict';

import test from 'ava';

const middlewareLoader = require('./express-assets-middlewares');

test('js.browserify', t => {
	t.is(typeof middlewareLoader.js.browserify, 'function');
});

test('css.sass', t => {
	t.is(typeof middlewareLoader.css.sass, 'function');
});

test('html.html', t => {
	t.is(typeof middlewareLoader.html.html, 'function');
});
