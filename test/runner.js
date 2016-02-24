var Acl = require('../')
  , tests = require('../node_modules/acl/test/tests')
  , ArangoDBBackend = require('../');
  describe('ArangoDB - Default', function () {
    before(function (done) {
      var self = this
        , arangojs = require('arangojs')
        , db = arangojs()
      db.dropDatabase("test", function(err, data){
          //ignore error and create test db
          db.createDatabase('test', function(innererr, innerdata){
              if(innererr) return done(innererr);
              db.useDatabase('test');
              self.backend = new Acl.arangodbBackend(db, "acl");
              done();
          });
      })
    })

    run()
  })


  // describe('ArangoDB - useSingle', function () {
  //   before(function (done) {
  //     var self = this
  //       , arangojs = require('arangojs')
  //       , db = arangojs()
  //
  //       db.dropDatabase("test", function(err, data){
  //           //ignore error and create test db
  //           db.createDatabase('test', function(innererr, innerdata){
  //               if(innererr) return done(innererr);
  //               db.useDatabase('test');
  //               self.backend = new Acl.arangodbBackend(db, "acl", true);
  //               done();
  //           });
  //       })
  //   })
  //
  //   run()
  // })

function run() {
  Object.keys(tests).forEach(function (test) {
    tests[test]()
  })
}
