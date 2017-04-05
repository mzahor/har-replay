#!/usr/bin/env node

'use strict';

// Loading modules
var fs = require('fs');
var _ = require('underscore');
var _s = require('underscore.string');
var request = require('request');
var moment = require('moment');
var commander = require('commander');
var chalk = require('chalk');

commander
    .option('-s, --site <site>', 'only fire requests that are for this domain (ignore everything else)')
    .option('-f, --file <file>', 'HAR file to replay')
    .option('-r, --repeat <times>', 'time to repeat')
    .option('-g, --regex <regex>', 'filter requests by regex')
    .parse(process.argv);

// Check arguments (file is required)
if (commander.file == undefined) {
    commander.outputHelp();
    process.exit();
}

function coloredResponse(statusCode) {
	if (statusCode > 300) {
		return chalk.red(statusCode);
	} else if (statusCode >= 300 && statusCode < 400) {
		return chalk.yellow(statusCode);
	} else {
		return chalk.green(statusCode);
	}
}

if (commander.regex) {
	var regexFilter = new RegExp(commander.regex);	
}

// Do the Bartman! :)
fs.readFile(commander.file, function(err, data) {
    if (err) throw err;
    var har = JSON.parse(data);

    var basetime = moment(har['log']['entries'][0]['startedDateTime']);

    for (let i = 0; i < commander.repeat; i++) {
        // Passing in an object
        _.forEach(har['log']['entries'], function(entry) {
        	// Ignore other urls and sites if so requested
        	if (commander.regex && !regexFilter.test(entry.request.url)) {
        		return;
        	}
            
            if (commander.site != undefined && entry.request.url.substring(7, 7 + commander.site.length) != commander.site)
                return;

            // How late did this request happen?
            var diff = moment(entry['startedDateTime']).diff(basetime, 'miliseconds');

            // Send a request into the future
            _.delay(function() {
                // New request
                var req = request({
                    url: entry.request.url,
                    method: entry.request.method,
                    // reformat headers from HAR format to a dict
                    headers: _.reduce(entry.request.headers, function(memo, e) {
                        if (e['name'][0] != ':')
                            memo[e['name']] = e['value'];
                        return memo;
                    }, {})
                }, function(error, response, body) {
                    // Just print a status, drop the files as soon as possible
                    if (response) {
                        console.log(entry.request.url + " => " + coloredResponse(response.statusCode));
                    } else {
                        // Likely failed because it was a websocket
                        console.log(entry.request.url + " => 0");
                    }
                });

                // Garbage collect, if we can (if started with --expose-gc)
                if (global.gc) {
                    global.gc();
                }
            }, diff);
        });
    }
});
