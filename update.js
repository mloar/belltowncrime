var q = require('request')
    ,query = require('./common').query
    ,waitAll = require('./common').waitAll
    ,end = require('./common').end
    ;

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
                        var promises = [];
                        var results = JSON.parse(body);

                        promises.push(query({
                            name: 'trim',
                            text: "DELETE FROM crimes WHERE occurred_date < NOW() - INTERVAL '2 months'",
                            values: []
                            }));
                        for (var i = 0; i < results.length; i++)
                        {
                            promises.push(query({
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
                            }));
                        }

                        // Remove rows erroneously exposed in view.
                        promises.push(query("DELETE FROM crimes WHERE hundred_block_location LIKE '%RICHMOND BEACH DR' OR hundred_block_location LIKE '%PINE ST' OR hundred_block_location LIKE '%8TH AVE'"));

                        waitAll(promises).then(end());
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
