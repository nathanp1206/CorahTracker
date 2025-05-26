const fs = require('fs');

const existsFile = ({ path, fileName }) => {
	return fs.existsSync(`${path}/${fileName}`);
};

const existsDir = ({ path }) => {
	return fs.existsSync(path);
};

const createDir = ({ path }) => {
	const exists = fs.existsSync(path);
	!exists && fs.mkdirSync(path);
	return fs.existsSync(path);
};

const write = ({ path, fileName, data, flags = 'w+' }) => {
	!fs.existsSync(path) && fs.mkdirSync(path);

	return !fs.writeFileSync(`${path}/${fileName}`, data, {
			flags,
			defaultEncoding: 'utf8',
			encoding: 'utf8',
		});
};

const read = ({ path, fileName, flags = 'r', isJSON = true }) => {
	const exists = existsFile({ path, fileName });

	let content = '';
	if (exists) {
		content = fs.readFileSync(`${path}/${fileName}`, {
			flags,
			defaultEncoding: 'utf8',
			encoding: 'utf8',
		});

		return isJSON ? JSON.parse(content) : content;
	} else {
		return null;
	}
};

const del = ({ path, fileName, flags = 'r' }) => {
	const exists = existsFile({ path, fileName });
	return exists ?
		!fs.unlinkSync(`${path}/${fileName}`) :
		false;
};

const erase = ({ path }) => {
	const exists = existsDir({ path });
	if (exists) {
		fs.readdirSync(path).forEach((file, index) => {
			const curPath = `${path}/${file}`;
			if (fs.lstatSync(curPath).isDirectory()) { // recurse
				/* istanbul ignore next */
				erase(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
		return true;
	} else {
		return false;
	}
};

module.exports = {
	write,
	read,
	del,
	erase,
	existsFile,
	existsDir,
	createDir,
};
