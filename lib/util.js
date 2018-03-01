'use strict';

const Util = require('util');

if (typeof Util.callbackify === 'function') {
    exports.callbackify = Util.callbackify.bind(Util);
}
else {
    const callbackifyOnRejected = (reason, cb) => {

        if (!reason) {
            const newReason = new Error('ERR_FALSY_VALUE_REJECTION');
            newReason.reason = reason;
            reason = newReason;
            Error.captureStackTrace(reason, callbackifyOnRejected);
        }

        return cb(reason);
    };

    exports.callbackify = (func) => {

        return function (...args) {

            const callback = args.pop();
            const cb = (...cbArgs) => void callback.apply(this, cbArgs);

            func.apply(this, args).then(
                (ret) => process.nextTick(cb, null, ret),
                (rej) => process.nextTick(callbackifyOnRejected, rej, cb)
            );
        };
    };
}
