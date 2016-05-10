'use strict';

const fs = require('fs');

const _ = require('lodash');
const minifier = require('html-minifier');

const AssetMiddleware = require('asset');

class HtmlMiddleware extends AssetMiddleware {
	constructor(filePath, options) {
		super(filePath, options);

		this.contentType = 'text/html';
	}

	static getDefaultOptions() {
		return {
			minifyOptions: {
				collapseBooleanAttributes: true,
				collapseInlineTagWhitespace: true,
				collapseWhitespace: true,
				conservativeCollapse: false,
				decodeEntities: true,
				removeComments: true,
				removeRedundantAttributes: true,
				sortAttributes: true,
				sortClassName: true
			}
		};
	}

	normalizeOptions(_options) {
		const options = _.defaults({}, _options, HtmlMiddleware.getDefaultOptions());
		return super.normalizeOptions(options);
	}

	getSource() {
		return new Promise((resolve, reject) => {
			fs.readFile(this.filePath, (err, fileContent) => {
				err ? reject(err) : resolve(fileContent);
			});
		}).then((src) => {
			return this.options.minify ? this.minify(src) : src;
		});
	}

	minify(src) {
		return minifier.minify(src.toString(), this.options.minifyOptions);
	}
}

module.exports = function htmlMiddleware(filePath, options) {
	let middleware = new HtmlMiddleware(filePath, options);
	const response = middleware.buildResponse();

	return function(req, res, next) {
		response.send(req, res, next);
	};
};
