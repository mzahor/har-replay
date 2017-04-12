const coloredResponse = require('./main').coloredResponse;
const chalk = require('chalk')

describe('coloredResponse', function() {
	it('should return red for 400-500', function() {
		const result = coloredResponse(500);
		console.log(result);
		console.log(chalk.red('wtc'));
	});
});