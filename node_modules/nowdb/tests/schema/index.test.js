const _path = require('path');
const sparkles = require('sparkles')();
const sinon = require('sinon');

const path = _path.resolve(__dirname, '../db_test');
const fileName = 'test_db.json';

const schema = require('../../src/schema')();
const file = require('../../src/utils/file');

const expect = global.expect;

describe('Schema', () => {
	describe('dirCreate', () => {
		beforeEach(() => {
			schema.dirDelete({ path, emit: false });
		});

		test('Should create a folder', () => {
			schema.dirCreate({ path, emit: false });
			const actual = file.existsDir({ path });
			const expected = true;
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = schema.dirCreate({ path, emit: false });
			const expected = { dirCreated: true, actionKey: 'DIR_CREATE' };
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, emit }) are not passed', () => {
			const actual = schema.dirCreate();
			const expected = {
				dirCreated: false,
				actionKey: 'DIR_CREATE',
				err: new Error('[dir.create] Missing props values were detected: [ path, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path,  emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.dirCreate({ path, emit: true });
			spyEmit.restore();

			const actual = spyEmit.calledOnce;
			const expected = true;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path,  emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.dirCreate({ path, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of dirCreate

	describe('dirDelete', () => {
		beforeEach(() => {
			schema.dirCreate({ path, emit: false });
		});

		test('Should delete a folder', () => {
			schema.dirDelete({ path, emit: false });
			const actual = file.existsDir({ path });
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = schema.dirDelete({ path, emit: false });
			const expected = { dirDelete: true, actionKey: 'DIR_DELETE' };
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, emit }) are not passed', () => {
			const actual = schema.dirDelete();
			const expected = {
				dirDelete: false,
				actionKey: 'DIR_DELETE',
				err: new Error('[dir.delete] Missing props values were detected: [ path, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path,  emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.dirDelete({ path, emit: true });
			spyEmit.restore();

			const actual = spyEmit.calledOnce;
			const expected = true;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path,  emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.dirDelete({ path, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of dirDelete

	describe('dirExist', () => {
		beforeEach(() => {
			schema.dirCreate({ path, emit: false });
		});

		test('Should return the expected object', () => {
			const actual = schema.dirExist({ path, emit: false });
			const expected = { isDirectory: true, actionKey: 'DIR_EXIST' };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when the folder doesn\'t exists', () => {
			schema.dirDelete({ path, emit: false });
			const actual = schema.dirExist({ path, emit: false });
			const expected = { isDirectory: false, actionKey: 'DIR_EXIST' };
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, emit }) are not passed', () => {
			const actual = schema.dirExist();
			const expected = {
				isDirectory: false,
				actionKey: 'DIR_EXIST',
				err: new Error('[dir.exist] Missing props values were detected: [ path, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path,  emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.dirExist({ path, emit: true });
			spyEmit.restore();

			const actual = spyEmit.calledOnce;
			const expected = true;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path,  emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.dirExist({ path, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of dirExist

	describe('create', () => {
		beforeEach(() => {
			schema.init({ path, emit: false });
		});

		test('Should create a json file', () => {
			schema.create({ path, fileName, emit: false });
			const actual = file.existsFile({ path, fileName });
			const expected = true;
			expect(actual).toEqual(expected);
		});

		test('Should write an initial empty object {}', () => {
			schema.create({ path, fileName, emit: false });
			const actual = file.read({ path, fileName });
			const expected = {};
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = schema.create({ path, fileName, emit: false });
			const expected = { schemaCreated: true, actionKey: 'SCHEMA_CREATE' };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when is called again', () => {
			schema.create({ path, fileName, emit: false });
			const actual = schema.create({ path, fileName, emit: false });
			const expected = { schemaCreated: true, actionKey: 'SCHEMA_CREATE' };
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, fileName, emit }) are not passed', () => {
			const actual = schema.create();
			const expected = {
				schemaCreated: false,
				actionKey: 'SCHEMA_CREATE',
				err: new Error('[schemaCreate] Missing props values were detected: [ path, fileName, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.create({ path, fileName, emit: true });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.create({ path, fileName, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of create

	describe('remove', () => {
		beforeEach(() => {
			schema.dirDelete({ path, emit: false });
			schema.dirCreate({ path, emit: false });
			schema.create({ path, fileName, emit: false });
		});

		test('Should delete a json file', () => {
			schema.remove({ path, fileName, emit: false });
			const actual = file.existsFile({ path, fileName });
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = schema.remove({ path, fileName, emit: false });
			const expected = { schemaRemoved: true, actionKey: 'SCHEMA_REMOVE' };
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object when is called again', () => {
			schema.remove({ path, fileName, emit: false });
			const actual = schema.remove({ path, fileName, emit: false });
			const expected = { schemaRemoved: true, actionKey: 'SCHEMA_REMOVE' };
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, fileName, emit }) are not passed', () => {
			const actual = schema.remove();
			const expected = {
				schemaRemoved: false,
				actionKey: 'SCHEMA_REMOVE',
				err: new Error('[schemaRemove] Missing props values were detected: [ path, fileName, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.remove({ path, fileName, emit: true });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.remove({ path, fileName, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of remove

	describe('exist', () => {
		beforeEach(() => {
			schema.dirDelete({ path, emit: false });
			schema.dirCreate({ path, emit: false });
			schema.create({ path, fileName, emit: false });
		});

		test('Should display that a json file exists', () => {
			schema.exist({ path, fileName, emit: false });
			const actual = file.existsFile({ path, fileName });
			const expected = true;
			expect(actual).toEqual(expected);
		});

		test('Should display that a json file doesn\'t exists', () => {
			schema.remove({ path, fileName, emit: false });
			schema.exist({ path, fileName, emit: false });
			const actual = file.existsFile({ path, fileName });
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = schema.exist({ path, fileName, emit: false });
			const expected = { isFile: true, actionKey: 'SCHEMA_EXIST' };
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, fileName, emit }) are not passed', () => {
			const actual = schema.exist();
			const expected = {
				schemaExist: false,
				actionKey: 'SCHEMA_EXIST',
				err: new Error('[schemaExist] Missing props values were detected: [ path, fileName, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.exist({ path, fileName, emit: true });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.remove({ path, fileName, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of exist

	describe('read', () => {
		beforeEach(() => {
			schema.dirDelete({ path, emit: false });
			schema.dirCreate({ path, emit: false });
			schema.create({ path, fileName, emit: false });
		});

		test('Should return the expected object', () => {
			const actual = schema.read({ path, fileName, emit: false });
			const expected = { schemaRead: true, tables: {}, actionKey: 'SCHEMA_READ' };
			expect(actual).toEqual(expected);
		});

		test('Should return tables equal null when there is not a json file', () => {
			schema.remove({ path, fileName, emit: false });
			const actual = schema.read({ path, fileName, emit: false });
			const expected = { schemaRead: false, tables: null, actionKey: 'SCHEMA_READ' };
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, fileName, emit }) are not passed', () => {
			const actual = schema.read();
			const expected = {
				schemaRead: false,
				actionKey: 'SCHEMA_READ',
				err: new Error('[schemaRead] Missing props values were detected: [ path, fileName, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.read({ path, fileName, emit: true });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.read({ path, fileName, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of read

	describe('init', () => {
		beforeEach(() => {
			schema.dirDelete({ path, emit: false });
		});

		test('Should create the folder and file', () => {
			schema.init({ path, fileName, emit: false });
			const actual = file.existsFile({ path, fileName });
			const expected = true;
			expect(actual).toEqual(expected);
		});

		test('Should return the expected object', () => {
			const actual = schema.init({ path, fileName, emit: false });
			const expected = { init: true, actionKey: 'SCHEMA_INIT' };
			expect(actual).toEqual(expected);
		});

		test('Should initialize the json file with an empty object', () => {
			schema.init({ path, fileName, emit: false });
			const actual = file.read({ path, fileName });
			const expected = {};
			expect(actual).toEqual(expected);
		});

		test('Should throw an error if ({ path, fileName, emit }) are not passed', () => {
			const actual = schema.init();
			const expected = {
				init: false,
				actionKey: 'SCHEMA_INIT',
				err: new Error('[schemaInit] Missing props values were detected: [ path, fileName, emit ]'),
			};
			expect(actual).toEqual(expected);
		});

		test('Should emit the message when { path, fileName, emit: true }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.init({ path, fileName, emit: true });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = false;
			expect(actual).toEqual(expected);
		});

		test('Should not emit the message when { path, fileName, emit: false }', () => {
			const spyEmit = sinon.spy(sparkles, 'emit');
			schema.init({ path, fileName, emit: false });
			spyEmit.restore();

			const actual = spyEmit.notCalled;
			const expected = true;
			expect(actual).toEqual(expected);
		});
	}); // end of init
});
