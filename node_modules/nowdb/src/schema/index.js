const fs = require('fs');
const _ = require('lodash');

const validate = require('../utils/validations');
const broadcast = require('../utils/broadcast');
const file = require('../utils/file');

const schema = ({ path: _path, fileName: _fileName, emit: _emit, adapter: _adapter } = {}) => {
	function init({ table, path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'SCHEMA_INIT';
		const action = 'schemaInit';

		try {
			validate.hasProps({ props: ['path', 'fileName', 'emit'], action, args: { path, fileName, emit } });

			const { isDirectory } = dirExist({ path, emit });
			!isDirectory && dirCreate({ path, emit });

			const { isFile } = exist({ path, fileName, emit });
			!isFile && create({ path, fileName, emit });

			return broadcast.emit({ action: 'db-event', emit, item: { init: true, actionKey }, adapter });
		} catch (err) {
			return broadcast.emit({ action: 'db-event', emit, item: { init: false, actionKey, err }, adapter });
		}
	}

	function read({ path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'SCHEMA_READ';
		const action = 'schemaRead';
		try {
			validate.hasProps({
				props: ['path', 'fileName', 'emit'], action, args: { path, fileName, emit },
			});

			const tables = file.read({ path, fileName });
			return !_.isNull(tables) ?
				broadcast.emit({ action: 'db-event', emit, item: { schemaRead: true, tables, actionKey }, adapter }) :
				broadcast.emit({
					action: 'db-event',
					emit,
					item: { schemaRead: false, tables: null, actionKey },
					adapter,
				});
		} catch (err) {
			return broadcast.emit({ action: 'db-event', emit, item: { schemaRead: false, actionKey, err }, adapter });
		}
	}

	function exist({ path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'SCHEMA_EXIST';
		const action = 'schemaExist';

		try {
			validate.hasProps({ props: ['path', 'fileName', 'emit'], action, args: { path, fileName, emit } });

			const exists = file.existsFile({ path, fileName });
			return exists ?
				broadcast.emit({ action: 'db-event', emit, item: { isFile: true, actionKey }, adapter }) :
				broadcast.emit({ action: 'db-event', emit, item: { isFile: false, actionKey }, adapter });
		} catch (err) {
			return broadcast.emit({
				action: 'db-event',
				emit,
				item: { schemaExist: false, actionKey, err },
				adapter,
			});
		}
	}

	function remove({ path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'SCHEMA_REMOVE';
		const action = 'schemaRemove';
		try {
			validate.hasProps({ props: ['path', 'fileName', 'emit'], action, args: { path, fileName, emit } });

			const { isFile } = exist({ path, fileName, emit });
			if (!isFile) {
				return broadcast.emit({ action: 'db-event', emit, item: { schemaRemoved: true, actionKey }, adapter });
			}

			const result = file.del({ path, fileName });
			return !_.isNull(result) ?
				broadcast.emit({ action: 'db-event', emit, item: { schemaRemoved: true, actionKey }, adapter }) :
				broadcast.emit({ action: 'db-event', emit, item: { schemaRemoved: false, actionKey }, adapter });
		} catch (err) {
			return broadcast.emit({
				action: 'db-event',
				emit,
				item: { schemaRemoved: false, actionKey, err },
				adapter,
			});
		}
	}

	function create({ path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'SCHEMA_CREATE';
		const action = 'schemaCreate';

		try {
			validate.hasProps({ props: ['path', 'fileName', 'emit'], action, args: { path, fileName, emit } });

			const { isFile } = exist({ path, fileName, emit });
			if (isFile) {
				return broadcast.emit({ action: 'db-event', emit, item: { schemaCreated: true, actionKey }, adapter });
			}

			const result = file.write({ path, fileName, data: '{}' });
			return result ?
				broadcast.emit({ action: 'db-event', emit, item: { schemaCreated: true, actionKey }, adapter }) :
				broadcast.emit({ action: 'db-event', emit, item: { schemaCreated: false, actionKey }, adapter });
		} catch (err) {
			return broadcast.emit({
				action: 'db-event',
				emit,
				item: { schemaCreated: false, actionKey, err },
				adapter,
			});
		}
	}

	function dirExist({ path = _path, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'DIR_EXIST';
		try {
			validate.hasProps({ props: ['path', 'emit'], action: 'dir.exist', args: { path, emit } });
			const exists = fs.existsSync(path);
			return exists ?
				broadcast.emit({ action: 'db-event', emit, item: { isDirectory: true, actionKey }, adapter }) :
				broadcast.emit({ action: 'db-event', emit, item: { isDirectory: false, actionKey }, adapter });
		} catch (err) {
			return broadcast.emit({
				action: 'db-event',
				emit,
				item: { isDirectory: false, actionKey, err },
				adapter,
			});
		}
	}

	function dirDelete({ path = _path, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'DIR_DELETE';
		try {
			validate.hasProps({ props: ['path', 'emit'], action: 'dir.delete', args: { path, emit } });
			file.erase({ path });
			return broadcast.emit({ action: 'db-event', emit, item: { dirDelete: true, actionKey }, adapter });
		} catch (err) {
			return broadcast.emit({ action: 'db-event', emit, item: { dirDelete: false, actionKey, err }, adapter });
		}
	}

	function dirCreate({ path = _path, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'DIR_CREATE';
		try {
			validate.hasProps({ props: ['path', 'emit'], action: 'dir.create', args: { path, emit } });
			const exists = file.existsDir({ path });
			!exists && fs.mkdirSync(path);

			return broadcast.emit({ action: 'db-event', emit, item: { dirCreated: true, actionKey }, adapter });
		} catch (err) {
			return broadcast.emit({ action: 'db-event', emit, item: { dirCreated: false, actionKey, err }, adapter });
		}
	}

	return {
		init,
		exist,
		create,
		remove,
		read,
		dirExist,
		dirCreate,
		dirDelete,
	};
};

module.exports = schema;
