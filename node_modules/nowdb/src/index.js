const sparkles = require('sparkles')();
const _schema = require('./schema');
const _table = require('./table');

module.exports = ({ path, fileName, emit = true, adapter = null }) => {
	return {
		schema: _schema({ path, fileName, emit, adapter }),
		setSchema: ({ emit = true, adapter = null }) => _schema({ path, fileName, emit, adapter }),
		table: _table({ path, fileName, emit, adapter }),
		setTable: ({ table, emit = true, adapter = null }) => _table({ path, fileName, table, emit, adapter }),
		sparkles,
	};
};
