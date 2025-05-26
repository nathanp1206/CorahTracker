const fs = require('fs');
const _path = require('path');

const path = _path.resolve(__dirname, '../db_test');
const fileName = 'test_db.json';

const file = require('../../src/utils/file');

const expect = global.expect;

describe('Util: File', () => {
	beforeEach(() => {
		file.erase({ path });
	});

	describe('existsDir', () => {
		test('Should return expected object when folder doesn\'t exist', () => {
			const actual = file.existsDir({ path });
			const expected = false;

			expect(actual).toEqual(expected);
		});

		test('Should return expected object when folder exists', () => {
			fs.mkdirSync(path);
			const actual = file.existsDir({ path });
			const expected = true;

			expect(actual).toEqual(expected);
		});
	}); // end of existsDir

	describe('createDir', () => {
		test('Should return expected object when folder doesn\'t exist', () => {
			const actual = file.createDir({ path });
			const expected = true;

			expect(actual).toEqual(expected);
		});

		test('Should return expected object when folder exists', () => {
			fs.mkdirSync(path);

			const actual = file.createDir({ path });
			const expected = true;

			expect(actual).toEqual(expected);
		});
	}); // end of createDir

	describe('existsFile', () => {
		test('Should return expected object when a file doesn\'t exist', () => {
			const actual = file.existsFile({ path, fileName });
			const expected = false;

			expect(actual).toEqual(expected);
		});

		test('Should return expected object when folder exists', () => {
			fs.mkdirSync(path);
			fs.writeFileSync(`${path}/${fileName}`, '{}', { encoding: 'utf8' });

			const actual = file.existsFile({ path, fileName });
			const expected = true;

			expect(actual).toEqual(expected);
		});
	}); // end of existsFile

	describe('write', () => {
		test('Should return expected object when folder / file doesn\'t exists', () => {
			const actual = file.write({ path, fileName, data: 'Hi World' });
			const expected = true;

			expect(actual).toEqual(expected);
		});

		test('Should overwrite the file', () => {
			file.write({ path, fileName, data: 'Matrix' });
			const actual = fs.readFileSync(`${path}/${fileName}`, { encoding: 'utf8' });
			const expected = 'Matrix';

			expect(actual).toEqual(expected);
		});
	}); // end of write

	describe('read', () => {
		test('Should return expected object when file doesn\'t exists', () => {
			const actual = file.read({ path, fileName, isJSON: false });
			const expected = null;

			expect(actual).toEqual(expected);
		});

		test('Should return the the file content', () => {
			file.write({ path, fileName, data: 'Matrix' });
			const actual = file.read({ path, fileName, isJSON: false });
			const expected = 'Matrix';

			expect(actual).toEqual(expected);
		});
	}); // end of read

	describe('del', () => {
		test('Should return expected object when file doesn\'t exists', () => {
			const actual = file.del({ path, fileName });
			const expected = false;

			expect(actual).toEqual(expected);
		});

		test('Should return the the file content', () => {
			file.write({ path, fileName, data: 'Matrix' });
			const actual = file.del({ path, fileName });
			const expected = true;

			expect(actual).toEqual(expected);
		});
	}); // end of del

	describe('erase', () => {
		test('Should return expected object when folder and files don\'t exist', () => {
			const actual = file.erase({ path, fileName });
			const expected = false;

			expect(actual).toEqual(expected);
		});

		test('Should return the the file content', () => {
			file.createDir({ path });
			file.write({ path, fileName, data: 'Matrix' });

			const actual = file.erase({ path });
			const expected = true;

			expect(actual).toEqual(expected);
		});
	}); // end of erase
});
