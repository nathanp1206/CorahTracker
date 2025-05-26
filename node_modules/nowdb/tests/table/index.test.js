const _path = require('path');
const sparkles = require('sparkles')();
const sinon = require('sinon');

const path = _path.resolve(__dirname, '../db_test');
const fileName = 'test_db.json';

const schema = require('../../src/schema')();
const table = require('../../src/table')();
const file = require('../../src/utils/file');

const expect = global.expect;

describe('Table', () => {
	describe('create', () => {
		beforeEach(() => {
			schema.dirDelete({ path, fileName, emit: false });
			schema.init({ path, fileName, emit: false });
		});

		test('Should create a couple of new property with an empty array inside the json file', () => {
			table.create({ table: 'Table_A', path, fileName, emit: false });
			table.create({ table: 'Table_B', path, fileName, emit: false });

			const actual = file.read({ path, fileName });
			const expected = { Table_A: [], Table_B: [] };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = table.create({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableCreated: true, actionKey: 'TABLE_CREATE' };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when method is called twice', () => {
			table.create({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.create({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableCreated: true, actionKey: 'TABLE_CREATE' };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when db is not object', () => {
			file.write({ path, fileName, data: 'Hi' });
			const actual = table.create({ table: 'Table_A', path, fileName, emit: false });
			const expected = {
				tableCreated: false,
				actionKey: 'TABLE_CREATE',
				err: new Error('Unexpected token H in JSON at position 0'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ table, path, fileName, emit }) are not passed', () => {
			const actual = table.create();
			const expected = {
				tableCreated: false,
				actionKey: 'TABLE_CREATE',
				err: new Error('[tableCreate] Missing props values were detected: [ path, fileName, table, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { table } is a string', () => {
			const actual = table.create({ table: 123, path, fileName, emit: true });
			const expected = {
				tableCreated: false,
				actionKey: 'TABLE_CREATE',
				err: new Error('[tableCreate] table prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, table, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.create({ table: 'Table_A', path, fileName, emit: true });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, table, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.create({ table: 'Table_A', path, fileName, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of create

	describe('exist', () => {
		beforeEach(() => {
			schema.dirDelete({ path, fileName, emit: false });
			schema.init({ path, fileName, emit: false });
		});

		test('Should return the expected object when table doesn\'t exist', () => {
			const actual = table.exist({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableExist: false, actionKey: 'TABLE_EXIST' };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when table exists', () => {
			table.create({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.exist({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableExist: true, actionKey: 'TABLE_EXIST' };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when method is called twice', () => {
			table.create({ table: 'Table_A', path, fileName, emit: false });
			table.exist({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.exist({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableExist: true, actionKey: 'TABLE_EXIST' };
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ table, path, fileName, emit }) are not passed', () => {
			const actual = table.exist();
			const expected = {
				tableExist: false,
				actionKey: 'TABLE_EXIST',
				err: new Error('[tableExist] Missing props values were detected: [ path, fileName, table, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { table } is a string', () => {
			const actual = table.exist({ table: 123, path, fileName, emit: true });
			const expected = {
				tableExist: false,
				actionKey: 'TABLE_EXIST',
				err: new Error('[tableExist] table prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, table, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.exist({ table: 'Table_A', path, fileName, emit: true });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, table, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.exist({ table: 'Table_A', path, fileName, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of exist

	describe('remove', () => {
		beforeEach(() => {
			schema.dirDelete({ path, fileName, emit: false });
			schema.init({ path, fileName, emit: false });
		});

		test('Should return the expected object when table doesn\'t exist', () => {
			const actual = table.remove({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableRemoved: true, actionKey: 'TABLE_REMOVE' };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when table is removed', () => {
			table.create({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.remove({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableRemoved: true, actionKey: 'TABLE_REMOVE' };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when method is called twice', () => {
			table.create({ table: 'Table_A', path, fileName, emit: false });
			table.remove({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.remove({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableRemoved: true, actionKey: 'TABLE_REMOVE' };
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ table, path, fileName, emit }) are not passed', () => {
			const actual = table.remove();
			const expected = {
				tableRemoved: false,
				actionKey: 'TABLE_REMOVE',
				err: new Error('[tableRemove] Missing props values were detected: [ path, fileName, table, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { table } is a string', () => {
			const actual = table.remove({ table: 123, path, fileName, emit: true });
			const expected = {
				tableRemoved: false,
				actionKey: 'TABLE_REMOVE',
				err: new Error('[tableRemove] table prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, table, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.remove({ table: 'Table_A', path, fileName, emit: true });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, table, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.remove({ table: 'Table_A', path, fileName, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of remove

	describe('read', () => {
		beforeEach(() => {
			schema.dirDelete({ path, fileName, emit: false });
			schema.init({ path, fileName, emit: false });
			table.create({ table: 'Table_A', path, fileName, emit: false });
		});

		test('Should return the expected object when table doesn\'t exist', () => {
			table.remove({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.read({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableRead: false, actionKey: 'TABLE_READ', rows: null };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when table is removed', () => {
			const actual = table.read({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableRead: true, actionKey: 'TABLE_READ', rows: [] };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when method is called twice', () => {
			table.read({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.read({ table: 'Table_A', path, fileName, emit: false });
			const expected = { tableRead: true, actionKey: 'TABLE_READ', rows: [] };
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ table, path, fileName, emit }) are not passed', () => {
			const actual = table.read();
			const expected = {
				tableRead: false,
				actionKey: 'TABLE_READ',
				err: new Error('[tableRead] Missing props values were detected: [ path, fileName, table, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { table } is a string', () => {
			const actual = table.read({ table: 123, path, fileName, emit: true });
			const expected = {
				tableRead: false,
				actionKey: 'TABLE_READ',
				err: new Error('[tableRead] table prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, table, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.read({ table: 'Table_A', path, fileName, emit: true });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, table, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.read({ table: 'Table_A', path, fileName, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of read

	describe('insert', () => {
		beforeEach(() => {
			schema.dirDelete({ path, fileName, emit: false });
			schema.init({ path, fileName, emit: false });
			table.create({ table: 'Table_A', path, fileName, emit: false });
		});

		test('Should return the expected object when table doesn\'t exist', () => {
			table.remove({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.insert({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowInserted: false,
				oldVal: null,
				newVal: null,
				table: 'Table_A',
				actionKey: 'TABLE_ROW_INSERT',
			};
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = table.insert({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowInserted: true,
				table: 'Table_A',
				oldVal: null,
				newVal: { name: 'Jhon', last: 'Wick', uid: actual.newVal.uid },
				actionKey: 'TABLE_ROW_INSERT',
			};
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, fileName, table, value, emit }) are not passed', () => {
			const actual = table.insert();
			const expected = {
				tableRowInserted: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_INSERT',
				err: new Error(
					'[tableRowInsert] Missing props values were detected: [ path, fileName, table, value, emit ]'
				),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { table } is a string', () => {
			const actual = table.insert({
				table: 123,
				value: { name: 'Jhon', last: 'Wick' },
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowInserted: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_INSERT',
				err: new Error('[tableRowInsert] table prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { value } is an object', () => {
			const actual = table.insert({
				table: 'Table_A',
				value: 'Hi',
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowInserted: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_INSERT',
				err: new Error('[tableRowInsert] value prop should be an object, currently passed [ Hi ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, table, value, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.insert({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				path,
				fileName,
				emit: true,
			});
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, table, value, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.insert({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				path,
				fileName,
				emit: false,
			});
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of insert

	describe('update', () => {
		let uid = '';
		beforeEach(() => {
			schema.dirDelete({ path, fileName, emit: false });
			schema.init({ path, fileName, emit: false });
			table.create({ table: 'Table_A', path, fileName, emit: false });

			const { newVal } = table.insert({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				path,
				fileName,
				emit: false,
			});
			uid = newVal.uid;
		});

		test('Should return the expected object when table doesn\'t exist', () => {
			table.remove({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.update({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				path,
				fileName,
				uid: 'n/a',
				emit: false,
			});
			const expected = {
				tableRowUpdated: false,
				oldVal: null,
				newVal: null,
				table: 'Table_A',
				actionKey: 'TABLE_ROW_UPDATE',
			};

			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = table.update({
				table: 'Table_A',
				value: { name: 'Steven', last: 'Perez' },
				uid,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowUpdated: true,
				table: 'Table_A',
				oldVal: { name: 'Jhon', last: 'Wick', uid },
				newVal: { name: 'Steven', last: 'Perez', uid },
				actionKey: 'TABLE_ROW_UPDATE',
			};

			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, fileName, table, value, uid, emit }) are not passed', () => {
			const actual = table.update();
			const expected = {
				tableRowUpdated: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_UPDATE',
				err: new Error(
					'[tableRowUpdate] Missing props values were detected: [ path, fileName, table, value, uid, emit ]'
				),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { table } is a string', () => {
			const actual = table.update({
				table: 123,
				value: { name: 'Steven', last: 'Perez' },
				uid,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowUpdated: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_UPDATE',
				err: new Error('[tableRowUpdate] table prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { value } is an object', () => {
			const actual = table.update({
				table: 'Table_A',
				value: 'Hi',
				uid,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowUpdated: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_UPDATE',
				err: new Error('[tableRowUpdate] value prop should be an object, currently passed [ Hi ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { uid } is a string', () => {
			const actual = table.update({
				table: 'Table_A',
				value: { name: 'Steven', last: 'Perez' },
				uid: 123,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowUpdated: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_UPDATE',
				err: new Error('[tableRowUpdate] uid prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, table, value, uid, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.update({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				uid,
				path,
				fileName,
				emit: true,
			});
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, table, value, uid, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.update({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				uid,
				path,
				fileName,
				emit: false,
			});
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of update

	describe('replace', () => {
		let uid = '';
		beforeEach(() => {
			schema.dirDelete({ path, fileName, emit: false });
			schema.init({ path, fileName, emit: false });
			table.create({ table: 'Table_A', path, fileName, emit: false });

			const { newVal } = table.insert({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				path,
				fileName,
				emit: false,
			});
			uid = newVal.uid;
		});

		test('Should return the expected object when table doesn\'t exist', () => {
			table.remove({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.replace({
				table: 'Table_A',
				value: { nombre: 'Jhon', apellido: 'Wick' },
				path,
				fileName,
				uid: 'n/a',
				emit: false,
			});
			const expected = {
				tableRowReplaced: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_REPLACE',
				err: new Error('[tableRowReplace] item with index [ -1 ] was not found.'),
			};

			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = table.replace({
				table: 'Table_A',
				value: { nombre: 'Steven', apellido: 'Perez' },
				uid,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowReplaced: true,
				table: 'Table_A',
				oldVal: { name: 'Jhon', last: 'Wick', uid },
				newVal: { nombre: 'Steven', apellido: 'Perez', uid },
				actionKey: 'TABLE_ROW_REPLACE',
			};

			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, fileName, table, value, uid, emit }) are not passed', () => {
			const actual = table.replace();
			const expected = {
				tableRowReplaced: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_REPLACE',
				err: new Error(
					'[tableRowReplace] Missing props values were detected: [ path, fileName, table, value, uid, emit ]'
				),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { table } is a string', () => {
			const actual = table.replace({
				table: 123,
				value: { name: 'Steven', last: 'Perez' },
				uid,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowReplaced: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_REPLACE',
				err: new Error('[tableRowReplace] table prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { value } is an object', () => {
			const actual = table.replace({
				table: 'Table_A',
				value: 'Hi',
				uid,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowReplaced: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_REPLACE',
				err: new Error('[tableRowReplace] value prop should be an object, currently passed [ Hi ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { uid } is a string', () => {
			const actual = table.replace({
				table: 'Table_A',
				value: { name: 'Steven', last: 'Perez' },
				uid: 123,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowReplaced: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_REPLACE',
				err: new Error('[tableRowReplace] uid prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, table, value, uid, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.replace({
				table: 'Table_A',
				value: { nombre: 'Jhon', apellido: 'Wick' },
				uid,
				path,
				fileName,
				emit: true,
			});
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, table, value, uid, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.replace({
				table: 'Table_A',
				value: { nombre: 'Jhon', apellido: 'Wick' },
				uid,
				path,
				fileName,
				emit: false,
			});
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of replace

	describe('del', () => {
		let uid = '';
		beforeEach(() => {
			schema.dirDelete({ path, fileName, emit: false });
			schema.init({ path, fileName, emit: false });
			table.create({ table: 'Table_A', path, fileName, emit: false });

			const { newVal } = table.insert({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				path,
				fileName,
				emit: false,
			});
			uid = newVal.uid;
		});

		test('Should return the expected object when table doesn\'t exist', () => {
			table.remove({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.del({
				table: 'Table_A',
				path,
				fileName,
				uid: 'n/a',
				emit: false,
			});
			const expected = {
				tableRowDeleted: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_DELETE',
				err: new Error('[tableRowDelete] item with index [ -1 ] was not found.'),
			};

			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = table.del({
				table: 'Table_A',
				uid,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowDeleted: true,
				table: 'Table_A',
				oldVal: { name: 'Jhon', last: 'Wick', uid },
				newVal: null,
				actionKey: 'TABLE_ROW_DELETE',
			};

			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, fileName, table, uid, emit }) are not passed', () => {
			const actual = table.del();
			const expected = {
				tableRowDeleted: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_DELETE',
				err: new Error(
					'[tableRowDelete] Missing props values were detected: [ path, fileName, table, uid, emit ]'
				),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { table } is a string', () => {
			const actual = table.del({
				table: 123,
				uid,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowDeleted: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_DELETE',
				err: new Error('[tableRowDelete] table prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { uid } is a string', () => {
			const actual = table.del({
				table: 'Table_A',
				uid: 123,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowDeleted: false,
				oldVal: null,
				newVal: null,
				actionKey: 'TABLE_ROW_DELETE',
				err: new Error('[tableRowDelete] uid prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, table, uid, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.del({
				table: 'Table_A',
				uid,
				path,
				fileName,
				emit: true,
			});
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, table, uid, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.del({
				table: 'Table_A',
				uid,
				path,
				fileName,
				emit: false,
			});
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of del

	describe('get', () => {
		let uid = '';
		beforeEach(() => {
			schema.dirDelete({ path, fileName, emit: false });
			schema.init({ path, fileName, emit: false });
			table.create({ table: 'Table_A', path, fileName, emit: false });

			const { newVal } = table.insert({
				table: 'Table_A',
				value: { name: 'Jhon', last: 'Wick' },
				path,
				fileName,
				emit: false,
			});
			uid = newVal.uid;
		});

		test('Should return the expected object when table doesn\'t exist', () => {
			table.remove({ table: 'Table_A', path, fileName, emit: false });

			const actual = table.get({
				table: 'Table_A',
				path,
				fileName,
				uid: 'n/a',
				emit: false,
			});
			const expected = {
				tableRowGet: false,
				actionKey: 'TABLE_ROW_GET',
				row: null,
			};

			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = table.get({
				table: 'Table_A',
				uid,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowGet: true,
				row: { name: 'Jhon', last: 'Wick', uid },
				actionKey: 'TABLE_ROW_GET',
			};

			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, fileName, table, uid, emit }) are not passed', () => {
			const actual = table.get();
			const expected = {
				tableRowGet: false,
				row: null,
				actionKey: 'TABLE_ROW_GET',
				err: new Error(
					'[tableRowGet] Missing props values were detected: [ path, fileName, table, uid, emit ]'
				),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { table } is a string', () => {
			const actual = table.get({
				table: 123,
				uid,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowGet: false,
				row: null,
				actionKey: 'TABLE_ROW_GET',
				err: new Error('[tableRowGet] table prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should valid { uid } is a string', () => {
			const actual = table.get({
				table: 'Table_A',
				uid: 123,
				path,
				fileName,
				emit: false,
			});
			const expected = {
				tableRowGet: false,
				row: null,
				actionKey: 'TABLE_ROW_GET',
				err: new Error('[tableRowGet] uid prop should be string, currently passed [ 123 ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, table, uid, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.get({
				table: 'Table_A',
				uid,
				path,
				fileName,
				emit: true,
			});
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, table, uid, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			table.get({
				table: 'Table_A',
				uid,
				path,
				fileName,
				emit: false,
			});
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of get
});
