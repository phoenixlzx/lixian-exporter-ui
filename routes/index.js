var config = require('../config.js');

var formidable = require('formidable');
var crypto = require('crypto');
var validator = require('validator');
var async = require('async');
var exec = require('child_process').exec;

var User = require('../models/user.js');

var gdriveid = '';

// Get gdriveid
exec('lixian info', function (error, stdout, stderr) {
    if (error || stderr) {
        callback(error || stderr, null);
    }
    gdriveid = stdout.toString().split("\n")[2].split(" ")[1];
});

module.exports = function(app) {

    app.get('/', csrf, checkLogin, function(req, res) {
        // Get tasks list
        exec('lixian list --download-url', function(error, stdout, stderr) {
            if (error || stderr) {
                console.log(error || stderr);
                return res.send(500);
            }
            var data =  stdout.toString().split("\n");

            res.render('index', {
                siteName: config.siteName,
                user: req.session.user,
                gdriveid: gdriveid,
                tasks: data
            });
        });
    });

    app.get('/task/:taskid', csrf, checkLogin, function(req, res) {
        exec('lixian list --download-url ' + req.params.taskid + '/', function(error, stdout, stderr) {
            if (error || stderr) {
                console.log(error);
                return res.send(500);
            }
            var data =  stdout.toString().split("\n");

            res.render('index', {
                siteName: config.siteName,
                user: req.session.user,
                gdriveid: gdriveid,
                tasks: data
            });
        });
    });

    app.get('/addnew', csrf, checkLogin, function(req, res) {
        res.render('addnew', {
            siteName: config.siteName,
            user: req.session.user
        });
    });

    app.post('/addnewlink', csrf, checkLogin, function(req, res) {
        exec('lixian add ' + req.body.fileLink, function(error, stdout, stderr) {
            if (error || stderr) {
                console.log(error);
                return res.send(500);
            }
            res.redirect('/');
        });
    });

    app.post('/addnewfile', csrf, checkLogin, function(req, res) {
        var form = new formidable.IncomingForm();

        form.parse(req, function(err, fields, files) {
            exec('lixian add --bt ' + files.fileTorrent.path, function(error, stdout, stderr) {
                if (error || stderr) {
                    console.log(error);
                    return res.send(500);
                }
                res.redirect('/');
            });
        });
    });

    app.get('/login', csrf, checkNotLogin, function(req, res) {
        res.render('login', {
            siteName: config.siteName
        });
    });

    app.post('/login', csrf, checkNotLogin, function(req, res) {
        if (!validator.isEmail(req.body.email) || !req.body.email) {
            res.status(400);
            return res.redirect('/login');
        }
        User.get(req.body.email, function(err, user) {
            if (err) {
                console.log(err);
                return res.send(500);
            }
            var hash = crypto.createHash('sha256'),
                password = hash.update(req.body.password).digest('hex');
            if (user.password !== password) {
                return res.send(401);
            } else {
                req.session.user = user;
                res.redirect('/');
            }
        });
    });

    app.get('/reg', csrf, checkNotLogin, function(req, res) {
        User.count(function(err, count) {
            if (err) {
                console.log(err);
                return res.send(500);
            }
            if (count !== 0) {
                return res.send(403);
            } else {
                res.render('reg', {
                    siteName: config.siteName
                });
            }
        });
    });

    app.post('/reg', csrf, checkNotLogin, function(req, res) {
        User.count(function(err, count) {
            if (err) {
                console.log(err);
                return res.send(500);
            }
            if (count !== 0) {
                return res.send(403);
            } else {
                if (!validator.isLength(req.body.password, 4, 32) ||
                    !validator.equals(req.body.password, req.body.repeatPassword) ||
                    !validator.isEmail(req.body.email)) {
                    res.status(400);
                    return res.redirect('/reg');
                }

                var hash = crypto.createHash('sha256'),
                    password = hash.update(req.body.password).digest('hex');
                var newuser = {
                    username: req.body.username,
                    email: req.body.email,
                    password: password,
                    role: 'admin'
                }

                User.addnew(newuser, function(err, user) {
                    if (err) {
                        console.log(err);
                        return res.send(500);
                    }
                    req.session.user = newuser;
                    res.redirect('/');
                });
            }
        });
    });


    // Session functions
    function checkLogin(req, res, next) {
        return next();
        if(!req.session.user) {
            res.status(401);
            return res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if(req.session.user) {
            return res.redirect('/');
        }
        next();
    }

    // CSRF Protect
    function csrf(req, res, next) {
        res.locals.token = req.csrfToken();
        next();
    }

}