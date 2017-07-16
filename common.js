var  bogart     = require('bogart')
    ,promise    = require('promised-io/promise')
    ,pg         = require('pg')
    ;

exports.query = function (q) {
    pg.defaults.ssl = true;
    return bogart.promisify(pg.connect, pg)(
        process.env.DATABASE_URL
    ).then(
        function (client) {
            return bogart.promisify(client.query, client)(q);
        });
}

exports.waitAll = promise.all;
exports.end = pg.end;
