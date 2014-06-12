var  bogart     = require('bogart')
    ,promise    = require('promised-io/promise')
    ,pg         = require('pg')
    ,url        = require('url')
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

exports.query = function (q) {
    return bogart.promisify(pg.connect, pg)(
        parseConnectionString(process.env.DATABASE_URL)
    ).then(
        function (client) {
            return bogart.promisify(client.query, client)(q);
        });
}

exports.waitAll = promise.all;
exports.end = pg.end;
