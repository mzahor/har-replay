har-replay
==========

A small, basic tool to replay requests from a HTTP Archive (HAR) file for testing purposes.

based on [this repo](https://github.com/kkovacs/har-replay) with some improvements.

Installation
============

    git clone https://github.com/kkovacs/har-replay
    cd har-replay
    npm update
    ./main.js -f <filename.har>

Usage
=====

    Usage: main.js [options]

    Options:

    -h, --help                              output usage information
    -s, --site <site>                       only fire requests that are for this domain (ignore everything else)
    -f, --file <file>                       HAR file to replay
    -r, --repeat <times>                    times to repeat
    -g, --regex <regex>                     filter requests by regex
    -i, --ignore-https-errors               ignore https errors
    -H, --override-headers-file <file>      override headers (in json file)

Examples
=====
`./main.js -f ~/somedomain.com_perftest.har -r 100 -g 'somedomain.com\/api'` - repeat 100 times each request and only execute requests which contain `somedomain.com/api` in url.