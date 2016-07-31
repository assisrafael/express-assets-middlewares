'use strict';

const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

/* global document */
/* eslint no-console: ["error", { allow: ["error"] }] */
const template = function template(error) {
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

module.exports = function formatError(err) {
	return `!${template}(${JSON.stringify(normalizeError(err))})`;
};