#!/usr/bin/env node

"use strict";

// Loading modules
const fs = require("fs");
const _ = require("underscore");
const _s = require("underscore.string");
const request = require("request");
const moment = require("moment");
const commander = require("commander");
const chalk = require("chalk");

function coloredResponse(statusCode) {
    if (statusCode > 300) {
        return chalk.red(statusCode);
    } else if (statusCode >= 300 && statusCode < 400) {
        return chalk.yellow(statusCode);
    } else {
        return chalk.green(statusCode);
    }
}

if (require.main === module) {
    replayHar();
}

function replayHar() {
    commander
        .option(
            "-s, --site <site>",
            "only fire requests that are for this domain (ignore everything else)"
        )
        .option("-f, --file <file>", "HAR file to replay")
        .option("-r, --repeat <times>", "time to repeat")
        .option("-b, --burst", "spawn all requests at the same time")
        .option("-g, --regex <regex>", "filter requests by regex")
        .option("-i, --ignore-https-errors", "ignore https errors")
        .option("-H, --override-headers-file <file>", "override headers")
        .parse(process.argv);

    // Check arguments (file is required)
    if (commander.file == undefined) {
        commander.outputHelp();
        process.exit();
    }

    if (commander.ignoreHttpsErrors) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    if (commander.regex) {
        var regexFilter = new RegExp(commander.regex);
    }

    if (commander.overrideHeadersFile) {
        let contents = require("fs").readFileSync(
            commander.overrideHeadersFile
        );
        var headerOverrides = JSON.parse(contents);
    }

    // Do the Bartman! :)
    fs.readFile(commander.file, function(err, data) {
        if (err) throw err;
        var har = JSON.parse(data);

        var basetime = moment(har["log"]["entries"][0]["startedDateTime"]);

        for (let i = 0; i < (commander.repeat || 1); i++) {
            // Passing in an object
            _.forEach(har["log"]["entries"], function(entry) {
                // Ignore other urls and sites if so requested
                if (commander.regex && !regexFilter.test(entry.request.url)) {
                    // console.log('Ignoring ', entry.request.url);
                    return;
                }

                if (
                    commander.site != undefined &&
                    entry.request.url.substring(7, 7 + commander.site.length) !=
                        commander.site
                )
                    return;

                const sendRequest = function() {
                    // New request
                    let start = moment();
                    let headers = _.reduce(
                        entry.request.headers,
                        function(memo, e) {
                            if (e["name"][0] != ":")
                                memo[e["name"]] = e["value"];
                            return memo;
                        },
                        {}
                    );

                    if (headerOverrides) {
                        Object.assign(headers, headerOverrides);
                    }

                    var req = request(
                        {
                            url: entry.request.url,
                            method: entry.request.method,
                            time: true,
                            // reformat headers from HAR format to a dict
                            headers
                        },
                        function(error, response, body) {
                            let end = moment();
                            // Just print a status, drop the files as soon as possible
                            if (response) {
                                const duration = Math.round(
                                    response.timingPhases.firstByte
                                );

                                console.log(
                                    `${entry.request.url} => ${coloredResponse(response.statusCode)} in ${duration}ms`
                                );
                                if (response.statusCode >= 500) {
                                    console.log(response.body);
                                }
                            } else {
                                // Likely failed because it was a websocket
                                console.log(entry.request.url + " => 0");
                                console.log(error);
                            }
                        }
                    );

                    // Garbage collect, if we can (if started with --expose-gc)
                    if (global.gc) {
                        global.gc();
                    }
                };
                if (commander.burst) {
                    sendRequest();
                } else {
                    // How late did this request happen?
                    var diff = moment(entry["startedDateTime"]).diff(
                        basetime,
                        "miliseconds"
                    );
                    _.delay(sendRequest, diff);
                }
            });
        }
    });
}

module.exports = {
    coloredResponse,
    replayHar
};
