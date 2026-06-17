const { throwAppError } = require('@app-core/errors');

function throwBusinessError(message, code) {
  throwAppError(message, code);
}

module.exports = throwBusinessError;
