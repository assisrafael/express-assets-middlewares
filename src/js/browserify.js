'use strict';

const _ = require('lodash');
const browserify = require('browserify');
const uglify = require('uglify-js');

const AssetMiddleware = require('asset');

var ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

var template = function template(error) {
	console.error(error);
	if (typeof document === 'undefined') {
		return;
	} else if (!document.body) {
		document.addEventListener('DOMContentLoaded', print);
	} else {
		print();
	}
	function print() {
		var pre = document.createElement('pre');
		pre.className = 'errorify';
		pre.textContent = error.message || error;
		if (document.body.firstChild) {
			document.body.insertBefore(pre, document.body.firstChild);
		} else {
			document.body.appendChild(pre);
		}
	}
}.toString();

function normalizeError(err) {
	var result = {};
	[
		'message',
		'line',
		'lineNumber',
		'column',
		'columnNumber',
		'name',
		'stack',
		'fileName'
	].forEach(function(key) {
		var val;
		if (key === 'message' && err.codeFrame) {
			val = err.message + '\n\n' + err.codeFrame; //babelify@6.x
		} else if (key === 'message') {
			val = err.annotated || err.message; //babelify@5.x and browserify
		} else {
			val = err[key];
		}

		if (typeof val === 'number') {
			result[key] = val;
		} else if (typeof val !== 'undefined') {
			result[key] = String(val).replace(ansiRegex, '');
		}
	});

	return result;
}

function defaultReplacer(err) {
	return '!' + template + '(' + JSON.stringify(normalizeError(err)) + ')';
}

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
				if (err) {
					return resolve(defaultReplacer(err));
				}

				resolve(src.toString());
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
		let options = this.options.minify;
		if (!options || typeof options !== 'object') {
			options = {};
		}

		options.fromString = true;

		return new Promise((resolve, reject) => {
			try {
				resolve(uglify.minify(src, options).code);
			} catch (ex) {
				reject(ex);
			}
		});
	}

	preminify(src) {
		if (!this.options.preminify) {
			return Promise.resolve(src);
		}

		return Promise.resolve(options.preminify(src));
	}

	postminify(src) {
		if (!this.options.postminify) {
			return Promise.resolve(src);
		}

		return Promise.resolve(options.postminify(src));
	}

	buildBundle() {
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
