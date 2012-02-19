var bogart = require('bogart')
    ,pg = require('pg')
    ,viewEngine = bogart.viewEngine('jade')
    ,middleware = require('./lib/middleware')
    ,settings = require('../settings')
    ;

require('bogart-jade');

var client = new pg.Client(settings.connectionString);
client.connect();

var router = bogart.router();
router.get('/', function (req) {
    return bogart.promisify(client.query, client)(
        "SELECT hundred_block_location, description, COUNT(go_number) AS incident_count FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '7 days 8 hours' AND NOT crimes.offense_code = 'X' GROUP BY hundred_block_location, crimes.offense_code, offense_descriptions.description ORDER By incident_count DESC"
        ).then(
        function (result) {
            return viewEngine.respond('index.jade',
            {
                locals: result
            });
        });
});
router.get('/major', function (req) {
    return bogart.promisify(client.query, client)(
        "SELECT DISTINCT hundred_block_location, description, occurred_date, go_number FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '2 months' AND (crimes.offense_code LIKE '12__' OR crimes.offense_code LIKE '130_' OR crimes.offense_code LIKE '22__' OR crimes.offense_code LIKE '9__') ORDER BY occurred_date DESC").then(
        function (result) {
            return viewEngine.respond('major.jade',
            {
                locals: result
            });
        });
});
router.get('/drugs', function (req) {
    return bogart.promisify(client.query, client)(
        "SELECT DISTINCT hundred_block_location, description, occurred_date, go_number FROM crimes LEFT JOIN offense_descriptions ON crimes.offense_code = offense_descriptions.offense_code WHERE occurred_date > NOW() - INTERVAL '2 months' AND crimes.offense_code LIKE '35__' ORDER BY occurred_date DESC").then(
        function (result) {
            return viewEngine.respond('drugs.jade',
            {
                locals: result
            });
        });
});

var app = bogart.app();

app.use(middleware.batteries);
app.use(router);

var port = process.env['PORT'] || 6000;
app.start(port);
