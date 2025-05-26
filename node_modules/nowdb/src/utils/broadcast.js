const _ = require('lodash');
const sparkles = require('sparkles')();

module.exports = {
	emit({ action, emit, item, adapter = null }) {
		if (emit) {
			const msg = _.cloneDeep(item);
			msg.adapter = adapter;
			sparkles.emit(action, msg);
		}
		return item;
	},
};
