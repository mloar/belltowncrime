var jade   = require('jade'),
  path      = require('path'),
  extname   = path.extname,
  fs        = require('fs'),
  promise   = require('promised-io/lib/promise'),
  when      = promise.when,
  settings = require('../settings'),
  pg        = require('pg');

exports.viewEngine = {};
exports.viewEngine.render = function(view, opts) {
    opts = opts || {};

    opts.locals = opts.locals || {};

    var
    self        = this,
    viewPath    = path.join(this.views, view),
    ext         = extname(viewPath),
    engine      = this.engineName,
    layout      = opts.layout === undefined ? true : opts.layout;

    layout = layout === true ? 'layout' + ext : layout;

    return when(promise.execute(fs.readFile, viewPath, 'utf8'), function (str) {
        var renderedView = jade.compile(str, opts)(opts.locals);

        if (layout) {
            opts.locals.body = renderedView;
            opts.layout = false;

            return self.render(layout, opts);
        }

        return renderedView;
    });
};
exports.viewEngine.views = 'views/';
exports.viewEngine.output = 'out/';
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

var client = new pg.Client(settings.connectionString);

function do_drugs() {
    return exports.promisify(client.query, client)(
        "SELECT DISTINCT hundred_block_location, description, occurred_date, go_number FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '2 months' AND crimes.offense_code LIKE '35__' ORDER BY occurred_date DESC").then(
            function (result) {
                return exports.viewEngine.render('drugs.jade', {locals: result}).then(
                    function (html) {
                        fs.writeFileSync('out/drugs', html);
                    });
            });
}

function do_major() {
    exports.promisify(client.query, client)(
        "SELECT DISTINCT hundred_block_location, description, occurred_date, go_number FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '2 months' AND (crimes.offense_code LIKE '12__' OR crimes.offense_code LIKE '130_' OR crimes.offense_code LIKE '22__' OR crimes.offense_code LIKE '9__') ORDER BY occurred_date DESC").then(
            function (result) {
                return exports.viewEngine.render('major.jade', {locals: result}).then(
                function (html) {
                    fs.writeFileSync('out/major', html);
                });
            });
}

function do_index() {
    exports.promisify(client.query, client)(
        "SELECT hundred_block_location, description, COUNT(DISTINCT go_number) AS incident_count FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '7 days 8 hours' AND NOT crimes.offense_code = 'X' GROUP BY hundred_block_location, crimes.offense_code, offense_descriptions.description ORDER By incident_count DESC, hundred_block_location"
    ).then(
        function (result) {
            return exports.viewEngine.render('index.jade', {locals: result}).then(
                function (html)
                {
                    fs.writeFileSync('out/index.html', html);
                });
        });
}

client.connect();
promise.all([do_index(), do_major(), do_drugs()]).then(function (whatever) {
    client.end();
});
