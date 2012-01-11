var q = require('request')
    ,pg = require('pg')
    ,settings = require('../settings')
    ;
var client = new pg.Client(settings.connectionString);
client.connect();
client.on('drain', function() {
  process.exit();
  });

var query = {
    "originalViewId" : "948u-h4tt",
    "name" :  "Recent",
    "query" : {
        "filterCondition" : {
            "type" : "operator",
            "value" : "OR",
            "children" : [ {
                "type" : "operator",
                "value" : "GREATER_THAN",
                "children" : [ {
                    "columnId" : 4533475,
                    "type" : "column"
                }, {
                    "type" : "literal",
                    "value" : "2012-01-01T00:00:00"
                } ],
            } ]
        }
    }
};

//q.post({
//    uri: 'http://data.seattle.gov/views/INLINE/rows.json?method=getRows&start=0&length=100',
//    json: query
//    }, function (err, response, body) {
//        if (!err && response.statusCode == 200)
//        {
//            console.log(JSON.stringify(body));
//        }
//        else if (err)
//        {
//            throw err;
//        }
//        else
//        {
//            console.log(response);
//        }
//    });

q('http://data.seattle.gov/views/948u-h4tt/', function (err, response, body) {
        if (!err && response.statusCode == 200)
        {
            var columnIds = {};
            var columns = JSON.parse(body)["columns"];
            for (var i = 0; i < columns.length; i++)
            {
                columnIds[columns[i]["fieldName"]] = columns[i]["id"];
            }

            q('http://data.seattle.gov/views/948u-h4tt/rows.json?method=getRows&start=0&length=100',
                function (err, response, body) {
                    if (!err && response.statusCode == 200)
                    {
                        var results = JSON.parse(body);

                        client.pauseDrain();
                        for (var i = 0; i < results.length; i++)
                        {
                            client.query({
                                name: 'insert',
                                text: "INSERT INTO crimes (cdw_number, go_number, offense_code, offense_code_ext, date_reported, occurred_date, hundred_block_location, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                                values: [
                                    results[i][columnIds["rms_cdw_id"].toString()],
                                    results[i][columnIds["general_offense_number"].toString()],
                                    results[i][columnIds["offense_code"].toString()],
                                    results[i][columnIds["offense_code_extension"].toString()],
                                    results[i][columnIds["date_reported"].toString()],
                                    results[i][columnIds["occurred_date_or_date_range_start"].toString()],
                                    results[i][columnIds["hundred_block_location"].toString()],
                                    results[i][columnIds["latitude"].toString()],
                                    results[i][columnIds["longitude"].toString()],
                                ]
                            }, function (err, result) {
                                if (err && err.code != '23505')
                                    console.log(err);
                            });
                        }

                        // Make sure at least one query is executed so that the
                        // drain event fires.
                        client.query("SELECT COUNT(*) FROM crimes");
                        client.resumeDrain();
                    }
                    else if (err)
                    {
                        throw err;
                    }
                    else
                    {
                        console.log(response);
                    }
                });
        }
        else if (err)
        {
            throw err;
        }
        else
        {
            throw response;
        }
});
