har-replay
==========

A small, basic tool to replay requests from a HTTP Archive (HAR) file for testing purposes.

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

	-h, --help            output usage information
	-s, --site <site>     only fire requests that are for this domain (ignore everything else)
	-f, --file <file>     HAR file to replay
	-r, --repeat <times>  times to repeat
    -g, --regex <regex>   filter requests by regex

Examples
=====
`./main.js -f ~/somedomain.com_perftest.har -r 100 -g 'somedomain.com\/api'` - repeat 100 times each request and only execute requests which contain `somedomain.com/api` in url.