module.exports = function*(obj) {
  for(let key of Object.keys(obj)) {
    yield([ key, value: obj[key] ])
  }
}
