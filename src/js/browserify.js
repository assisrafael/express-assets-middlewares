'use strict';

const _ = require('lodash');

const AssetMiddleware = require('asset');

function arrayify(val) {
	if (val && !Array.isArray(val) && typeof val !== 'boolean') {
		return [val];
	} else {
		return val;
	}
}

class BrowserifyMiddleware extends AssetMiddleware {
	constructor(filePath, options) {
		super(filePath, options);

		this.contentType = 'application/javascript';
		this.bundle = this.buildBundle();
	}

	static getDefaultOptions() {
		return {
			external: [],
			ignore: [],
			ignoreMissing: false,
			transform: [],
			insertGlobals: false,
			detectGlobals: true,
			standalone: false,
			noParse: [],
			extensions: [],
			basedir: undefined,
			grep: /\.js$/
		};
	}

	normalizeOptions(_options) {
		const options = _.defaults({}, _options, BrowserifyMiddleware.getDefaultOptions());

		options.external = arrayify(options.external);
		options.ignore = arrayify(options.ignore);
		options.transform = arrayify(options.transform);
		options.noParse = arrayify(options.noParse);
		options.extensions = arrayify(options.extensions);

		return super.normalizeOptions(options);
	}

	getSource() {
		return new Promise((resolve) => {
			this.bundle.bundle((err, src) => {
				if (this.options.cache !== 'dynamic') {
					delete this.bundle;
				}

				if (err) {
					const formatError = require('./browserify-format-error');
					return resolve(formatError(err));
				}

				let sourceCode = src.toString();

				resolve(sourceCode);
			});
		}).then((src) => {
			return this.options.postcompile ? this.options.postcompile(src) : src;
		}).then((src) => {
			if (!this.options.minify) {
				return src;
			}

			return this.preminify(src).then((src) => {
				return this.minify(src);
			}).then((src) => {
				return this.postminify(src);
			});
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

	preminify(src) {
		if (!this.options.preminify) {
			return Promise.resolve(src);
		}

		return Promise.resolve(this.options.preminify(src));
	}

	postminify(src) {
		if (!this.options.postminify) {
			return Promise.resolve(src);
		}

		return Promise.resolve(this.options.postminify(src));
	}

	buildBundle() {
		const browserify = require('browserify');
		const options = this.options;

		const bundle = browserify({
			noParse: options.noParse,
			extensions: options.extensions,
			resolve: options.resolve,
			insertGlobals: options.insertGlobals || false,
			detectGlobals: options.detectGlobals || false,
			ignoreMissing: options.ignoreMissing,
			bundleExternal: options.bundleExternal,
			basedir: options.basedir,
			debug: options.debug,
			standalone: options.standalone || false,
			cache: options.cache === 'dynamic' ? {} : undefined,
			packageCache: options.cache === 'dynamic' ? {} : undefined
		});

		bundle.add(this.filePath);

		if (options.plugins) {
			let plugins = options.plugins; // in the format options.plugins = [{plugin: plugin, options: options}, {plugin: plugin, options: options}, ... ]
			for (let i = 0; i < plugins.length; i++) {
				let obj = plugins[i];
				bundle.plugin(obj.plugin, obj.options);
			}
		}

		for (let i = 0; i < (options.transform || []).length; i++) {
			let transform = options.transform[i];

			if (Array.isArray(transform)) {
				bundle.transform(transform[1], transform[0]);
			} else {
				bundle.transform(transform);
			}
		}

		for (let i = 0; i < (options.external || []).length; i++) {
			bundle.external(options.external[i]);
		}

		for (let i = 0; i < (options.ignore || []).length; i++) {
			bundle.ignore(options.ignore[i]);
		}

		return bundle;
	}

	watch(onUpdateFn) {
		const watchify = require('watchify');

		this.bundle = watchify(this.bundle, {
			poll: true, delay: 0
		});

		this.bundle.on('update', onUpdateFn);

		return () => {
			this.bundle.close();
		};
	}
}

module.exports = function browserifyMiddleware(filePath, options) {
	let middleware = new BrowserifyMiddleware(filePath, options);
	const response = middleware.buildResponse();

	return function(req, res, next) {
		response.send(req, res, next);
	};
};
