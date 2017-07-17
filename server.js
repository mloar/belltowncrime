var
     bogart = require('bogart')
    ,fs     = require('fs')
    ,pug   = require('pug')
    ,path   = require('path')
    ,query  = require('./common').query
    ;

var render = function(view, opts) {
    opts = opts || {};

    opts.locals = opts.locals || {};

    var
    viewPath    = path.join('views/', view),
    layout      = opts.layout === undefined ? true : opts.layout;
    layout      = layout === true ? 'layout.pug' : layout;

    var renderedView = pug.compileFile(viewPath, opts)(opts.locals);

    if (layout) {
        opts.locals.body = renderedView;
        opts.layout = false;

        return render(layout, opts);
    }

    return renderedView;
};

var router = bogart.router();
router.get('/', function (req) {
    return query("SELECT hundred_block_location, description, COUNT(DISTINCT go_number) AS incident_count FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '7 days 8 hours' AND NOT crimes.offense_code = 'X' GROUP BY hundred_block_location, crimes.offense_code, offense_descriptions.description ORDER By incident_count DESC, hundred_block_location").then(
        function (result) {
            return bogart.html(render('index.pug', {locals: result}));
        });
});
router.get('/drugs', function (req) {
    return query(
        "SELECT DISTINCT hundred_block_location, description, occurred_date, go_number FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '2 months' AND crimes.offense_code LIKE '35__' ORDER BY occurred_date DESC").then(
            function (result) {
                return bogart.html(render('drugs.pug', {locals: result}));
            });
});
router.get('/liquor', function (req) {
    return query(
    "SELECT * FROM liquor_actions ORDER BY date DESC").then(
        function (result) {
            return bogart.html(render('liquor.pug', {locals: result}));
        });
});
router.get('/major', function (req) {
    return query(
        "SELECT DISTINCT hundred_block_location, description, occurred_date, go_number FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '2 months' AND (crimes.offense_code LIKE '12__' OR crimes.offense_code LIKE '130_' OR crimes.offense_code LIKE '22__' OR crimes.offense_code LIKE '9__') ORDER BY occurred_date DESC").then(
            function (result) {
                return bogart.html(render('major.pug', {locals: result}));
            });
});
router.get('/main.css', function (req) {
    return bogart.promisify(fs.readFile)('main.css', 'utf-8').then(function (body) {
        return {
            status: 200,
            body: [body],
            headers: {'content-type': 'text/css', 'content-length': Buffer.byteLength(body, 'utf-8')}
        };
    });
});

var app = bogart.app();
app.use(router);
app.start(process.env.PORT);
