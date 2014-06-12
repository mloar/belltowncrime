var jade   = require('jade'),
  path      = require('path'),
  extname   = path.extname,
  fs        = require('fs'),
  query     = require('./common').query,
  end       = require('./common').end,
  waitAll   = require('./common').waitAll;

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

    var renderedView = jade.compile(fs.readFileSync(viewPath, { encoding: 'utf8' }), opts)(opts.locals);

    if (layout) {
        opts.locals.body = renderedView;
        opts.layout = false;

        return self.render(layout, opts);
    }

    return renderedView;
};
exports.viewEngine.views = 'views/';
exports.viewEngine.output = 'out/';

function do_drugs() {
    return query(
        "SELECT DISTINCT hundred_block_location, description, occurred_date, go_number FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '2 months' AND crimes.offense_code LIKE '35__' ORDER BY occurred_date DESC").then(
            function (result) {
                var html = exports.viewEngine.render('drugs.jade', {locals: result});
                console.log('drugs');
                return fs.writeFileSync('out/drugs', html);
            });
}

function do_major() {
    return query(
        "SELECT DISTINCT hundred_block_location, description, occurred_date, go_number FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '2 months' AND (crimes.offense_code LIKE '12__' OR crimes.offense_code LIKE '130_' OR crimes.offense_code LIKE '22__' OR crimes.offense_code LIKE '9__') ORDER BY occurred_date DESC").then(
            function (result) {
                var html = exports.viewEngine.render('major.jade', {locals: result});
                console.log('major');
                return fs.writeFileSync('out/major', html);
            });
}

function do_liquor() {
    return query(
        "SELECT * FROM liquor_actions ORDER BY date DESC").then(
            function (result) {
                var html = exports.viewEngine.render('liquor.jade', {locals: result});
                console.log('liquor');
                return fs.writeFileSync('out/liquor', html);
            });
}

function do_index() {
    return query("SELECT hundred_block_location, description, COUNT(DISTINCT go_number) AS incident_count FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '7 days 8 hours' AND NOT crimes.offense_code = 'X' GROUP BY hundred_block_location, crimes.offense_code, offense_descriptions.description ORDER By incident_count DESC, hundred_block_location").then(
        function (result) {
            var html = exports.viewEngine.render('index.jade', {locals: result});
            console.log('index');
            return fs.writeFileSync('out/index.html', html);
        });
}

waitAll([do_index(), do_major(), do_drugs(), do_liquor()]).then(end());
