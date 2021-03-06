/*
 * User functions model
 * */

/*
 * User object
 * {
 *   _id: ObjectId(),
 *   email: 'test@example.com',
 *   password: sha256('mypassword'),
 *   role: 'user'
 * }
 * */

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var config = require('../config.js');


MongoClient.connect(config.mongodb, { db: { native_parser: true, w : 1 } }, function(err, db) {
    if(err) {
        throw err;
    }

    var collection = db.collection('users');

    exports.addnew = function(user, callback) {
        collection.insert(user, {safe: true}, function(err, user) {
            if (err) {
                return callback(err, null);
            }
            callback(null, user);
        });
    }

    exports.get = function(email, callback) {
        collection.findOne({
            email: email
        }, function(err, user) {
            if (err) {
                return callback(err, null);
            }
            callback(null, user);
        });
    }

    exports.count = function(callback) {
        collection.find().count(function(err, count) {
            if (err) {
                return callback(err, null);
            }
            callback(null, count);
        });
    }

    exports.remove = function(uid, callback) {
        collection.remove({
            _id: new ObjectID(uid)
        }, function(err) {
            if (err) {
                return callback(err, null);
            }
            callback();
        });
    }
});