#NODE ACL - ArangoDB backend
This fork adds ArangoDB backend support to [NODE ACL](https://github.com/OptimalBits/node_acl)

##Status
[![license - MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![BuildStatus](https://secure.travis-ci.org/nharris85/node_acl_arangodb.png?branch=master)](http://travis-ci.org/nharris85/node_acl_arangodb)

[![NPM status](https://nodei.co/npm/acl-arangodb.png?downloads=true&stars=true)](https://www.npmjs.com/package/acl-arangodb)

[![Dependency Status](https://david-dm.org/nharris85/node_acl_arangodb.svg)](https://david-dm.org/nharris85/node_acl_arangodb)
[![devDependency Status](https://david-dm.org/nharris85/node_acl_arangodb/dev-status.svg)](https://david-dm.org/nharris85/node_acl_arangodb#info=devDependencies)

##Installation

Using npm:

```javascript
npm install acl-arangodb
```

##Usage
Download and install [ArangoDB](https://www.arangodb.com/)
Start ArangoDB with default configuration.
Create ArangoDB database object in your node.js application.
Create acl module and instantiate it with ArangoDB backend, passing the ArangoDB object into the backend instance.

```javascript
// require arangojs
var arangojs = require('arangojs');
// Defaults to localhost and '_system' database. See arangojs documentation for configuration options
var db = arangojs();
// Set the database for your ACL. Note: You must create the database if it doesn't exist already.
db.useDatabase('mydb');

// require acl and create ArangoDB backend
var Acl = require('acl');
// Doesn't set a 'prefix' for collections and separates buckets into multiple collections.
acl = new Acl(new Acl.arangodbBackend(db));

// Alternatively, set a prefix and combined buckets into a single collection
acl = new Acl(new Acl.arangodbBackend(db, 'acl_', true));
```
##Testing
Tested using acl's tests runner against ArangoDB v2.8.11

##Documentation
See [NODE ACL documentation](https://github.com/OptimalBits/node_acl#documentation)
See [ArangoDB documentation](https://docs.arangodb.com)
