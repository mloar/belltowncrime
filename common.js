var imports
,promise   = require('promised-io/promise')
,pg        = require('pg')
,url       = require('url')
;

var parseConnectionString = function(str) {
  //unix socket
  if(str.charAt(0) === '/') {
    return { host: str };
  }
  var result = url.parse(str);
  var config = {};
  config.host = result.hostname;
  config.database = result.pathname ? result.pathname.slice(1) : null
  var auth = (result.auth || ':').split(':');
  config.user = auth[0];
  config.password = auth[1];
  config.port = result.port;
  config.ssl = true;
  return config;
};
/**
 * Wraps a Node.JS style asynchronous function `function(err, result) {}` 
 * to return a `Promise`.
 *
 * @param {Function} nodeAsyncFn  A node style async function expecting a callback as its last parameter.
 * @param {Object}   context      Optional, if provided nodeAsyncFn is run with `this` being `context`.
 *
 * @returns {Function} A function that returns a promise.
 */
exports.promisify = function(nodeAsyncFn, context) {
  return function() {
    var defer = promise.defer()
      , args = Array.prototype.slice.call(arguments);

    args.push(function(err, val) {
      if (err !== null) {
        return defer.reject(err);
      }

      return defer.resolve(val);
    });

    nodeAsyncFn.apply(context || {}, args);

    return defer.promise;
  };
};

exports.query = function (q) {
    return exports.promisify(pg.connect, pg)(
        parseConnectionString(process.env.DATABASE_URL)
    ).then(
        function (client) {
            return exports.promisify(client.query, client)(q);
        });
}

exports.waitAll = promise.all;
exports.end = pg.end;
