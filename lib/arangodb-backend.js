/**
  ArangoDB Backend.
  Implementation of the storage backend using MongoDB
*/
"use strict";

var contract = require('acl/lib/contract');
var async = require('async');
var _ = require('lodash');
var qb = require('aqb');

// Name of the collection where meta and allowsXXX are stored.
// If prefix is specified, it will be prepended to this name, like acl_resources
var aclCollectionName = 'resources';

/**
  Assumes db is the following:
  var db = require('arangojs');
  db.useDatabase(MY_DB);
  Such that MY_DB already exists
*/
function ArangoDBBackend(db, prefix, useSingle){
  this.db = db;
  this.prefix = typeof prefix !== 'undefined' ? prefix : '';
  this.useSingle = (typeof useSingle !== 'undefined') ? useSingle : false;
}

ArangoDBBackend.prototype = {
 /**
     Begins a transaction.
  */
  begin : function(){
    // returns a transaction object(just an array of functions will do here.)
    return [];
  },

  /**
     Ends a transaction (and executes it)
  */
  end : function(transaction, cb){
    contract(arguments).params('array', 'function').end();
    async.series(transaction,function(err){
      cb(err instanceof Error? err : undefined);
    });
  },

  /**
    Cleans the whole storage.
  */
  clean : function(cb){
    contract(arguments).params('function').end();
    var self = this;
    self.db.collections(true, function(err, collections) {
      if (err instanceof Error) return cb(err);
      async.forEach(collections,function(coll,innercb){
        var collection = self.db.collection(coll.name);
        collection.drop(function(){innercb()}); // ignores errors
      },cb);
    });
  },

  /**
     Gets the contents at the bucket's key.
  */
  get : function(bucket, key, cb){
    contract(arguments)
        .params('string', 'string|number', 'function')
        .end();
    key = encodeText(key);
    var searchParams = (this.useSingle? {_bucketname: bucket, key:key} : {key:key});
    var collName = this.prefix + (this.useSingle? aclCollectionName : bucket);
    collName = encodeCollectionName(collName);
    var util = require('util');

    var collection = this.db.collection(collName);
    collection.firstExample(searchParams, function(error, response){
        if(error && error.code === 404) return cb(undefined, []);
        if(error) return cb(error);
        if (! _.isObject(response) ) return cb(undefined, []);

        var doc = fixKeys(response);
        cb(undefined, _.without(_.keys(doc), "key", "_id", "_key", "_rev", "_bucketname"));
    });
  },

  /**
    Returns the union of the values in the given keys.
  */
  union : function(bucket, keys, cb){
    contract(arguments)
      .params('string', 'array', 'function')
      .end();
    keys = encodeAll(keys);
    var collName = this.prefix + (this.useSingle? aclCollectionName : bucket);
    var queryFilter = qb.in('doc.key', qb(keys));
    if(this.useSingle)
        queryFilter = qb.and(queryFilter, qb.eq('doc._bucketname', qb(bucket)));
    collName = encodeCollectionName(collName);
    var query = qb.for('doc').in(collName).filter(queryFilter).return('doc').toAQL()
    this.db.query(query, function(err, cursor){
        if(err) return cb(err);
        cursor.all(function(err, docs){
            if(err instanceof Error) return cb(err);
            if(!docs.length) return cb(undefined, []);
            var keyArrays = [];
            docs = fixAllKeys(docs);
            docs.forEach(function(doc){
                keyArrays.push.apply(keyArrays, _.keys(doc));
            });
            cb(undefined, _.without(_.union(keyArrays), "key", "_id", "_bucketname", "_key", "_rev"));
        })
    });
  },

  /**
    Adds values to a given key inside a bucket.
  */
  add : function(transaction, bucket, key, values){
    contract(arguments)
        .params('array', 'string', 'string|number','string|array|number')
        .end();

    if(key=="key") throw new Error("Key name 'key' is not allowed.");
    key = encodeText(key);
    var self=this;

    var searchExp = (self.useSingle? {_bucketname: bucket, key:key} : {key:key});
    var collName = self.prefix + (self.useSingle? aclCollectionName : bucket);
    collName = encodeCollectionName(collName);
    var options = {limit: 1}

    transaction.push(function(cb){
        var collection = self.db.collection(collName);
        collection.create(function(err, data){
            cb(undefined);
        });
    });

    transaction.push(function(cb){
      values = makeArray(values);
      var doc = {};
      values.forEach(function(value){doc[value]=true;});
      var insertExp = doc;
      _.merge(insertExp, searchExp);
      self.db.query(qb.upsert(qb(searchExp)).insert(qb(insertExp)).update(qb(doc)).in(collName).options(qb(options)).toAQL(), function(err){
          if(err instanceof Error) return cb(err);
          cb(undefined);
      });
    });
  },

  /**
     Delete the given key(s) at the bucket
  */
  del : function(transaction, bucket, keys){
    contract(arguments)
        .params('array', 'string', 'string|array')
        .end();
    keys = makeArray(keys);
    var self= this;
    var queryFilter = qb.in('doc.key', qb(keys));
    if(this.useSingle)
        queryFilter = qb.and(queryFilter, qb.eq('doc._bucketname', qb(bucket)));
    var collName = self.prefix + (self.useSingle? aclCollectionName : bucket);
    collName = encodeCollectionName(collName);

    transaction.push(function(cb){
        self.db.query(qb.for('doc').in(collName).filter(queryFilter).remove('doc').in(collName).toAQL(), function(err, cursor){
            if(err instanceof Error) return cb(err);
            cb(undefined);
        });
    });
  },

  /**
    Removes values from a given key inside a bucket.
  */
  remove : function(transaction, bucket, key, values){
    contract(arguments)
        .params('array', 'string', 'string|number','string|array|number')
        .end();
    key = encodeText(key);
    var self=this;
    var updateParams = (self.useSingle? {_bucketname: bucket, key:key} : {key:key});
    var collName = self.prefix + (self.useSingle? aclCollectionName : bucket);
    var options = {limit: 1, keepNull: false};
    collName = encodeCollectionName(collName);

    values = makeArray(values);
    transaction.push(function(cb){
        var collection = self.db.collection(collName);
        collection.create(function(err, data){
            // ignore if duplication error
            if(err && err.code !== 409) return cb(err);
            cb(undefined);
        });
    });

    transaction.push(function(cb){
        var collection = self.db.collection(collName);
        var doc = {};
        values.forEach(function(value){doc[value]=null;});
        collection.updateByExample(updateParams, doc, options, function(err){

            if(err instanceof Error) return cb(err);
            cb(undefined);
        });
    });
  }
}

function encodeText(text) {
  if (typeof text == 'string' || text instanceof String) {
    text = encodeURIComponent(text);
    text = text.replace(/\./g, '%2E');
  }
  return text;
}

function decodeText(text) {
  if (typeof text == 'string' || text instanceof String) {
    text = decodeURIComponent(text);
  }
  return text;
}

function encodeAll(arr) {
  if (Array.isArray(arr)) {
    var ret = [];
    arr.forEach(function(aval) {
      ret.push(encodeText(aval));
    });
    return ret;
  } else {
    return arr;
  }
}

function decodeAll(arr) {
  if (Array.isArray(arr)) {
    var ret = [];
    arr.forEach(function(aval) {
      ret.push(decodeText(aval));
    });
    return ret;
  } else {
    return arr;
  }
}

function fixKeys(doc) {
  if (doc) {
    var ret = {};
    for (var key in doc) {
      if (doc.hasOwnProperty(key)) {
        ret[decodeText(key)] = doc[key];
      }
    }
    return ret;
  } else {
    return doc;
  }
}

function fixAllKeys(docs) {
  if (docs && docs.length) {
    var ret = [];
    docs.forEach(function(adoc) {
      ret.push(fixKeys(adoc));
    });
    return ret;
  } else {
    return docs;
  }
}

function makeArray(arr){
  return Array.isArray(arr) ? encodeAll(arr) : [encodeText(arr)];
}

function encodeCollectionName(name){
    // ArangoDB only allows Alphanumeric, '-', and '_' characters for collection names
    return name.replace(/[^a-zA-z0-9\-_]+/g, '_');
}

exports = module.exports = ArangoDBBackend;
