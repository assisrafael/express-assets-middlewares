'use strict';

const _ = require('lodash');

const AssetMiddleware = require('asset');

class RollupMiddleware extends AssetMiddleware {
	constructor(filePath, options) {
		super(filePath, options);

		this.contentType = 'application/javascript';
		this.cache = null;
	}

	static getDefaultOptions() {
		return {
			format: 'cjs'
		};
	}

	normalizeOptions(_options) {
		const options = _.defaults({}, _options, RollupMiddleware.getDefaultOptions());

		const nodeResolve = require('rollup-plugin-node-resolve');
		const commonjs = require('rollup-plugin-commonjs');

		options.plugins = _.union(options.plugins, [
			nodeResolve(),
			commonjs(),
		]);

		return super.normalizeOptions(options);
	}

	getSource() {
		const rollup = require('rollup');

		rollup.rollup({
			entry: this.filePath,
			cache: this.cache,
			plugins: this.options.plugins
		}).then((bundle) => {
			const result = bundle.generate({
				format: this.options.format
			});

			this.cache = bundle;

			return result.code;
		}).then((src) => {
			if (!this.options.minify) {
				return src;
			}

			return this.minify(src);
		});
	}

	minify(src) {
		const uglify = require('uglify-js');
		let options = this.options.minify;
		if (!options || typeof options !== 'object') {
			options = {};
		}

		options.fromString = true;

		try {
			return Promise.resolve(uglify.minify(src, options).code);
		} catch (ex) {
			return Promise.reject(ex);
		}
	}
}

module.exports = function rollupMiddleware(filePath, options) {
	let middleware = new RollupMiddleware(filePath, options);
	const response = middleware.buildResponse();

	return function(req, res, next) {
		response.send(req, res, next);
	};
};
