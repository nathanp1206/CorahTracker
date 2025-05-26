const _ = require('lodash');

module.exports = {
	hasProps({ args, props = [], action = '' }) {
			const missingProps = _.reduce(props, (accumulator, prop) => {
				if (!_.has(args, prop) || _.chain(args[prop]).toString().isEmpty().value()) {
					accumulator.push(prop);
				}
				return accumulator;
			}, []);

			const message = `[${action}] Missing props values were detected: [ ${missingProps.join(', ')} ]`;
			if (_.size(missingProps) > 0) {
				throw new Error(message);
			}
	},
	validUid({ action, uid, actionKey }) {
		if (!_.isString(uid)) {
			const message = `[${action}] uid prop should be string, currently passed [ ${uid} ]`;
			throw new Error(message);
		}
	},
	validValue({ action, value, actionKey }) {
		if (!_.isObject(value)) {
			const message = `[${action}] value prop should be an object, currently passed [ ${value} ]`;
			throw new Error(message);
		}
	},
	validIndex({ action, index, actionKey }) {
		if (!_.gte(index, 0)) {
			const message = `[${action}] item with index [ ${index} ] was not found.`;
			throw new Error(message);
		}
	},
	validTable({ action, table, actionKey }) {
		if (!_.isString(table)) {
			const message = `[${action}] table prop should be string, currently passed [ ${table} ]`;
			throw new Error(message);
		}
	},
};
