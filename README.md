# express-assets-middlewares

[![NPM](https://nodei.co/npm/express-assets-middlewares.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/express-assets-middlewares/)

ExpressJS middlewares for JavaScript, HTML and CSS files with embedded preprocessing (browserify, sass, etc).


## Dependencies

- node@>=4
- express@>=4.13


## Disclaimer

It's not recomended to use this package in production.

This package was heavily inspired by:

* [browserify-middleware](https://www.npmjs.com/package/browserify-middleware)
* [errorify](https://www.npmjs.com/package/errorify)


## Usage


```javascript
const express = require('express');
const app = express();
const browserifyMiddleware = require('express-assets-middlewares').js.browserify;

//...

app.get('/path/to/file.js', browserifyMiddleware('path/to/file.js'));

//or using the express router
const router = express.router();
router.get('/path/to/another-file.js', browserifyMiddleware('path/to/another-file.es6.js'));
app.use(router);
//..

app.listen();

```


## Available middlewares

### Browserify

```javascript
const browserifyMiddleware = require('express-assets-middlewares').js.browserify;

app.use('/path/to/file.js', browserifyMiddleware('path/to/file.js'));
```

When `process.env.NODE_ENV === 'development'` [watchify](https://www.npmjs.com/package/watchify) will be started for automatic rebuilds.

### SASS/SCSS

```javascript
const sassMiddleware = require('express-assets-middlewares').css.sass;

app.use('/path/to/file.css', sassMiddleware('path/to/file.scss'), {
  watch: 'path/to/**/*.scss'
});
```

When `process.env.NODE_ENV === 'development'` [chokidar](https://www.npmjs.com/package/chokidar) will be started for automatic rebuilds.

### HTML

```javascript
const htmlMiddleware = require('express-assets-middlewares').html.html;

app.use('/path/to/file.html', htmlMiddleware('path/to/file.html'), {
  watch: 'path/to/**/*.html'
});
```

When `process.env.NODE_ENV === 'development'` [chokidar](https://www.npmjs.com/package/chokidar) will be started for automatic rebuilds.

## License

The MIT License (MIT)

Copyright (c) 2016 Igor Rafael

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
