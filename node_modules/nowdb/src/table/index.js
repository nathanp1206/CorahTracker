const _ = require('lodash');
const uuid = require('uuid/v4');

const validate = require('../utils/validations');
const broadcast = require('../utils/broadcast');
const file = require('../utils/file');

const table = ({ table: _table, path: _path, fileName: _fileName, emit: _emit, adapter: _adapter } = {}) => {
	function create({ table = _table, path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'TABLE_CREATE';
		const action = 'tableCreate';

		try {
			validate.hasProps({
				props: ['path', 'fileName', 'table', 'emit'], action, args: { path, fileName, table, emit },
			});
			validate.validTable({ action, actionKey, table });

			const { tableExist } = exist({ table, path, fileName, emit });
			if (tableExist) {
				return broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableCreated: true, actionKey },
					adapter,
				});
			}

			let db = file.read({ path, fileName });
			db[table] = [];
			db = JSON.stringify(db);

			const result = file.write({ path, fileName, data: db });
			return result ?
				broadcast.emit({ action: 'table-event', emit, item: { tableCreated: true, actionKey }, adapter }) :
				broadcast.emit({ action: 'table-event', emit, item: { tableCreated: false, actionKey }, adapter });
		} catch (err) {
			return broadcast.emit({
				action: 'table-event',
				emit,
				item: { tableCreated: false, actionKey, err },
				adapter,
			});
		}
	}

	function exist({ table = _table, path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'TABLE_EXIST';
		const action = 'tableExist';

		try {
			validate.hasProps({
				props: ['path', 'fileName', 'table', 'emit'], action, args: { path, fileName, table, emit },
			});
			validate.validTable({ action, actionKey, table });

			const db = file.read({ path, fileName });
			const result = _.has(db, table);
			return result ?
				broadcast.emit({ action: 'table-event', emit, item: { tableExist: true, actionKey }, adapter }) :
				broadcast.emit({ action: 'table-event', emit, item: { tableExist: false, actionKey }, adapter });
		} catch (err) {
			return broadcast.emit({
				action: 'table-event',
				emit,
				item: { tableExist: false, actionKey, err },
				adapter,
			});
		}
	}

	function remove({ table = _table, path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'TABLE_REMOVE';
		const action = 'tableRemove';

		try {
			validate.hasProps({
				props: ['path', 'fileName', 'table', 'emit'], action, args: { path, fileName, table, emit },
			});
			validate.validTable({ action, actionKey, table });

			let db = file.read({ path, fileName });
			db = _.omit(db, [table]);
			db = JSON.stringify(db);

			const result = file.write({ path, fileName, data: db });
			return result ?
				broadcast.emit({ action: 'table-event', emit, item: { tableRemoved: true, actionKey }, adapter }) :
				broadcast.emit({ action: 'table-event', emit, item: { tableRemoved: false, actionKey }, adapter });
		} catch (err) {
			return broadcast.emit({
				action: 'table-event',
				emit,
				item: { tableRemoved: false, actionKey, err },
				adapter,
			});
		}
	}

	function read({ table = _table, path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'TABLE_READ';
		const action = 'tableRead';

		try {
			validate.hasProps({
				props: ['path', 'fileName', 'table', 'emit'], action, args: { path, fileName, table, emit },
			});
			validate.validTable({ action, actionKey, table });

			let db = file.read({ path, fileName });
			const rows = _.cloneDeep(db[table]);

			return rows ?
				broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableRead: true, rows, actionKey },
					adapter,
				}) :
				broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableRead: false, rows: null, actionKey },
					adapter,
				});
		} catch (err) {
			return broadcast.emit({ action: 'table-event', emit, item: { tableRead: false, actionKey, err }, adapter });
		}
	}

	function insert(
		{ table = _table, value, path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}
	) {
		const actionKey = 'TABLE_ROW_INSERT';
		const action = 'tableRowInsert';

		try {
			validate.hasProps({
				props: ['path', 'fileName', 'table', 'value', 'emit'],
				action,
				args: { path, fileName, table, value, emit },
			});

			validate.validTable({ action, actionKey, table });
			validate.validValue({ action, actionKey, value });

			let db = file.read({ path, fileName });

			const uid = { uid: uuid() };
			const row = _.assign({}, value, uid);

			if (!db[table]) {
				return broadcast.emit({
					action: 'table-event',
					emit,
					table,
					item: { tableRowInserted: false, table, oldVal: null, newVal: null, actionKey },
					adapter,
				});
			}

			db[table].push(row);
			db = JSON.stringify(db);

			const result = file.write({ path, fileName, data: db });
			return result ?
				broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableRowInserted: true, table, oldVal: null, newVal: row, actionKey },
					adapter,
				}) :
				broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableRowInserted: false, table, oldVal: null, newVal: null, actionKey },
					adapter,
				});
		} catch (err) {
			return broadcast.emit({
				action: 'table-event',
				emit,
				item: { tableRowInserted: false, oldVal: null, newVal: null, actionKey, err },
				adapter,
			});
		}
	}

	function update(
		{ table = _table, uid, value, path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}
	) {
		const actionKey = 'TABLE_ROW_UPDATE';
		const action = 'tableRowUpdate';

		try {
			validate.hasProps({
				props: ['path', 'fileName', 'table', 'value', 'uid', 'emit'],
				action,
				args: { path, fileName, table, value, uid, emit },
			});
			validate.validTable({ action, actionKey, table });
			validate.validUid({ action, actionKey, uid });
			validate.validValue({ action, actionKey, value });

			let db = file.read({ path, fileName });

			if (!db[table]) {
				return broadcast.emit({
					action: 'table-event',
					emit,
					table,
					item: { tableRowUpdated: false, table, oldVal: null, newVal: null, actionKey },
					adapter,
				});
			}

			const index = _.findIndex(db[table], { uid });
			validate.validIndex({ action, actionKey, index });

			const oldVal = _.cloneDeep(db[table][index]);
			const newVal = _.assign({}, oldVal, value);

			db[table] = [
				..._.slice(db[table], 0, index),
				newVal,
				..._.slice(db[table], index + 1),
			];

			db = JSON.stringify(db);

			const result = file.write({ path, fileName, data: db });
			return result ?
				broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableRowUpdated: true, table, oldVal, newVal, actionKey },
					adapter,
				}) :
				broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableRowUpdated: false, table, oldVal, newVal: null, actionKey },
					adapter,
				});
		} catch (err) {
			return broadcast.emit({
				action: 'table-event',
				emit,
				item: { tableRowUpdated: false, oldVal: null, newVal: null, actionKey, err },
				adapter,
			});
		}
	}

	function replace(
		{ table = _table, uid, value, path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}
	) {
		const actionKey = 'TABLE_ROW_REPLACE';
		const action = 'tableRowReplace';

		try {
			validate.hasProps({
				props: ['path', 'fileName', 'table', 'value', 'uid', 'emit'],
				action,
				args: { path, fileName, table, value, uid, emit },
			});
			validate.validTable({ action, actionKey, table });
			validate.validUid({ action, actionKey, uid });
			validate.validValue({ action, actionKey, value });

			let db = file.read({ path, fileName });

			const index = _.findIndex(db[table], { uid });
			validate.validIndex({ action, actionKey, index });

			const oldVal = _.cloneDeep(db[table][index]);
			const newVal = _.assign({}, value, { uid });

			db[table] = [
				..._.slice(db[table], 0, index),
				newVal,
				..._.slice(db[table], index + 1),
			];

			db = JSON.stringify(db);

			const result = file.write({ path, fileName, data: db });
			return result ?
				broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableRowReplaced: true, table, oldVal, newVal, actionKey },
					adapter,
				}) :
				broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableRowReplaced: false, table, oldVal, newVal: null, actionKey },
					adapter,
				});
		} catch (err) {
			return broadcast.emit({
				action: 'table-event',
				emit,
				item: { tableRowReplaced: false, oldVal: null, newVal: null, actionKey, err },
				adapter,
			});
		}
	}

	function del({ table = _table, uid, path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'TABLE_ROW_DELETE';
		const action = 'tableRowDelete';

		try {
			validate.hasProps({
				props: ['path', 'fileName', 'table', 'uid', 'emit'],
				action,
				args: { path, fileName, table, uid, emit },
			});
			validate.validTable({ action, actionKey, table });
			validate.validUid({ action, actionKey, uid });

			let db = file.read({ path, fileName });

			const index = _.findIndex(db[table], { uid });
			validate.validIndex({ action, actionKey, index });

			const oldVal = _.cloneDeep(db[table][index]);

			db[table] = [
				..._.slice(db[table], 0, index),
				..._.slice(db[table], index + 1),
			];

			db = JSON.stringify(db);

			const result = file.write({ path, fileName, data: db });
			return result ?
				broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableRowDeleted: true, table, oldVal, newVal: null, actionKey },
					adapter,
				}) :
				broadcast.emit({
					action: 'table-event',
					emit,
					item: { tableRowDeleted: false, table, oldVal, newVal: null, actionKey },
					adapter,
				});
		} catch (err) {
			return broadcast.emit({
				action: 'table-event',
				emit,
				item: { tableRowDeleted: false, oldVal: null, newVal: null, actionKey, err },
				adapter,
			});
		}
	}

	function get({ table = _table, uid, path = _path, fileName = _fileName, emit = _emit, adapter = _adapter } = {}) {
		const actionKey = 'TABLE_ROW_GET';
		const action = 'tableRowGet';

		try {
			validate.hasProps({
				props: ['path', 'fileName', 'table', 'uid', 'emit'], action, args: { path, fileName, table, uid, emit },
			});
			validate.validTable({ action, actionKey, table });
			validate.validUid({ action, actionKey, uid });

			let db = file.read({ path, fileName });

			const itemFound = _.chain(db[table]).filter({ uid }).first().value();
			const item =
				!itemFound ?
					{ tableRowGet: false, row: null, actionKey } :
					{ tableRowGet: true, row: itemFound, actionKey };
			return broadcast.emit({ action: 'table-event', emit, item, adapter });
		} catch (err) {
			return broadcast.emit({
				action: 'table-event',
				emit,
				item: { tableRowGet: false, actionKey, row: null, err },
				adapter,
			});
		}
	}

	return {
		exist,
		create,
		remove,
		insert,
		read,
		get,
		update,
		replace,
		del,
	};
};

module.exports = table;
