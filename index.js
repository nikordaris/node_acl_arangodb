module.exports = require('acl');

module.exports.__defineGetter__('arangodbBackend', function(){
    return require('./lib/arangodb-backend.js');
});
