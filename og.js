/**package
{
  "name"        : "og",
  "version"     : "1.0.0",
  "description" : "A generator yielding keys and values"
}
**/

'use-strict';

module.exports = function*(obj) {
   for (let key of Object.keys(obj)) {
     yield [key, obj[key]];
   }
}
