const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    const primaryMessage = errorArray[0]?.message || 'Validation failed';
    return res.status(422).json({
      success: false,
      message: primaryMessage,
      errors: errorArray,
    });
  }
  next();
}

module.exports = { validate };
