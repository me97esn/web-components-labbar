'use strict';
let _functions = [];
const numOfStoredValues = 5;

const smoothFn = function(key) {
  let storedValues = [];

  return function(value) {
    storedValues.push(value);

    const sum = storedValues.reduce((x, y) => x + y)
    storedValues = storedValues.slice(-numOfStoredValues);

    const avg = sum / storedValues.length;


    return avg;
  }
}

module.exports = function(key, value) {
  const _fun = _functions[key] || smoothFn(key);
  _functions[key] = _fun;
  return _fun(value);
}