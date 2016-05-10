'use strict';

const sass = require('node-sass');
const CleanCSS = require('clean-css');

const AssetMiddleware = require('asset');

class SassMiddleware extends AssetMiddleware {
	constructor(filePath, options) {
		super(filePath, options);

		this.contentType = 'text/css';
	}

	getSource() {
		return new Promise((resolve, reject) => {
			sass.render({
				file: this.filePath
			}, (err, result) => {
				err ? reject(err) : resolve(result.css.toString());
			});
		}).then((src) => {
			return this.options.minify ? this.minify(src) : src;
		});
	}

	minify(src) {
		return new Promise((resolve, reject) => {
			new CleanCSS({
				keepSpecialComments: 0
			}).minify(src, function(err, minified) {
				err ? reject(err) : resolve(minified.styles);
			});
		});
	}
}

module.exports = function sassMiddleware(filePath, options) {
	let middleware = new SassMiddleware(filePath, options);
	const response = middleware.buildResponse();

	return function(req, res, next) {
		response.send(req, res, next);
	};
};
