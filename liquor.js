var q = require('request')
    ,query = require('./common').query
    ,apricot = require('apricot').Apricot
    ,promise = require('promised-io/promise')
    ;
/**
 * Wraps a Node.JS style asynchronous function `function(err, result) {}` 
 * to return a `Promise`.
 *
 * @param {Function} nodeAsyncFn  A node style async function expecting a callback as its last parameter.
 * @param {Object}   context      Optional, if provided nodeAsyncFn is run with `this` being `context`.
 *
 * @returns {Function} A function that returns a promise.
 */
var promisify = function(nodeAsyncFn, context) {
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

promisify(q.post)({uri: 'http://www.liq.wa.gov/lcbservices/LicensingInfo/MediaReleasesReport3Excel.asp', body:
    'txtFormat=Excel&cboCity=SEATTLE&hiddenCounty=King', headers: {'Content-Type':
    'application/x-www-form-urlencoded'}}).then(function (resp) {
            promisify(apricot.parse)(resp.body).then(
                function (doc) {
                    var mode = 0;
                    var newApps = [];
                    var dateExp = /Notification Date:/;
                    var otherExp = new RegExp("(\\w[\\w ]*)(\\(s\\))?(</a>)?:(</b>)?&nbsp;");
                    doc.find('table[border="1"] tr').each(function (r) { 
                        var cells = r.cells._toArray();
                        if (cells[0].tagName == 'TH')
                        {
                            if (mode++) return;
                        }
                        else if (mode == 1)
                        {
                            if (dateExp.test(cells[0].innerHTML))
                            {
                                newApps.push({'Date': cells[1].innerHTML});
                            }
                            else
                            {
                                if (otherExp.test(cells[0].innerHTML))
                                {
                                    newApps[newApps.length - 1][otherExp.exec(cells[0].innerHTML)[1]] = cells[1].innerHTML;
                                }
                            }
                        }
                    });

                    var results = newApps.filter(function (r) {
                        return /98121/.test(r['New Business Location']) || /98121/.test(r['Business Location']);
                    });
                    console.log(results);

                    /*var getCallback = function (d) {
                        return function (err, result) {
                            if (err && err.code != '23505') {
                                d.reject(err);
                            } else {
                                d.resolve();
                            }
                        }
                    };*/
                    var promises = [];
                    for (var i = 0; i < results.length; i++)
                    {
                        var d = promise.defer();
                        promises.push(d);
                        query({
                            name: 'insert',
                            text: "INSERT INTO liquor_actions (current_business_name, new_business_name, business_location, current_applicant, new_applicant, license_type, application_type, license_number, date)VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                            values: [
                                results[i]['Current Business Name'] || results[i]['Business Name'],
                                results[i]['New Business Name'],
                                results[i]['Business Location'],
                                results[i]['Current Applicant'] || results[i]['Applicant'],
                                results[i]['New Applicant'],
                                results[i]['Liquor License Type'],
                                results[i]['Application Type'],
                                results[i]['License Number'],
                                results[i]['Date'],
                            ]
                        });
                    }

                    promise.all(promises).then(function () {
                        client.end();
                        });
                });
    });
