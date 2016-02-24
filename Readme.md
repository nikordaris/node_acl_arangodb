#NODE ACL - ArangoDB backend
This fork adds ArangoDB backend support to [NODE ACL](https://github.com/OptimalBits/node_acl)

##Status

[![BuildStatus](https://secure.travis-ci.org/nharris85/node_acl_arangodb.png?branch=master)](http://travis-ci.org/nharris85/node_acl_arangodb)
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
Tested using acl's tests runner against ArangoDB v2.8.3

##Documentation
See [NODE ACL documentation](https://github.com/OptimalBits/node_acl#documentation)
See [ArangoDB documentation](https://docs.arangodb.com)

##License

(The MIT License)

Copyright (c) 2016 Nick Harris <nharris85@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
