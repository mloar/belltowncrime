var bogart = require('bogart');

/**
 * Remove gzip from bogart.batteries for node 0.4.7 support.
 *
 * Includes the following JSGI Chain:
 *
 * error -> validateResponse -> directory -> parted -> methodOverride 
 *       -> session -> flash -> bodyAdapter -> stringReturnAdapter -> nextApp
 *
 * @param {Object} config   Optional configuration, if arity is two first parameter is config.
 * @param {Function} nextApp  The next application (Middleware, Bogart Router, etc...) in the JSGI chain.
 * @returns {Function} A good default middleware stack in one function call.
 */
exports.batteries = function(config, nextApp) {
    var root = 'public';

    if (nextApp === undefined) {
        nextApp = config;
    }

    if (!nextApp) {
        throw 'Bogart batteries requires at least one parameter, a nextApp to execute to fulfill the request.'
    }

    var stack = bogart.middleware.Error(
        bogart.middleware.directory(root,
            bogart.middleware.Parted(
                bogart.middleware.MethodOverride(
                    bogart.middleware.Session( 
                        bogart.middleware.Flash(
                            bogart.middleware.bodyAdapter(
                                bogart.middleware.stringReturnAdapter(nextApp))))))));

    return stack;
};
