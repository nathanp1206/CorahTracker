const _ = require('lodash');
const _path = require('path');

const path = _path.resolve(__dirname, '../db_test');
const fileName = 'test_db.json';

const nowDB = require('../src/index');

const expect = global.expect;

describe('nowDB', () => {
	test('Should return an object', () => {
		const actual = _.isObject(nowDB({ path, fileName }));
		const expected = true;

		expect(actual).toEqual(expected);
	});

	test('setSchema instance should return a schema object', () => {
		const actual = _.keys(nowDB({ path, fileName }).setSchema({ emit: false }));
		const expected = _.keys(nowDB({ path, fileName }).schema);

		expect(actual).toEqual(expected);
	});

	test('setSchema setTable should return a schema object', () => {
		const actual = _.keys(nowDB({ path, fileName }).setTable({ table: 'Table_A', emit: false }));
		const expected = _.keys(nowDB({ path, fileName }).table);

		expect(actual).toEqual(expected);
	});
});
