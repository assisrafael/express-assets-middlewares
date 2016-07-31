'use strict';

module.exports = {
	js: {
		get browserify() {
			return require('./js/browserify');
		},
		get rollup() {
			return require('./js/rollup');
		}
	},
	css: {
		get sass() {
			return require('./css/sass');
		}
	},
	html: {
		get html() {
			return require('./html/html');
		}
	}
};
