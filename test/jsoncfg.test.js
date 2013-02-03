"use strict"

var jsoncfg = require('../lib/jsoncfg')
  , testutil = require('testutil')
  , fs = require('fs-extra')
  , path = require('path')
  , P = require('autoresolve')
  , ms = require('ms')

var TEST_DIR = ''

describe('jsoncfg', function() {
  beforeEach(function(done) {
    TEST_DIR = testutil.createTestDir('jsoncfg')
    fs.copy(P('test/resources/config'), TEST_DIR, function(err) {
      if (err && err.length > 0) done(err[0])
      done()
    })
  })

  describe('+ loadFiles()', function() {
    it('should load the json files', function(done) {
      jsoncfg.loadFiles(TEST_DIR, function(err, files, errInfo) {
        T (err) //problem parsing malformed.json
        T (errInfo.malformed)
        T (errInfo.malformed.message.indexOf("Unexpected token") >= 0)

        T (files.database)
        T (files.shopping)
        T (files['weird name2'])
        T (files['weird-name'])
        T (files.weird_name3)

        EQ (files.database.production.port, 27017)

        done()
      })
    })

    describe('> when a cache is present', function() {
      it('should load the files except the cached', function(done) {
        var files = jsoncfg.loadFilesSync(TEST_DIR)

        EQ (files.database.production.host, 'myserver.com')
        files.database.production.host = 'yourserver.com'
        var dbFile = path.join(TEST_DIR, 'database.json')
        var cache = {}
        cache[dbFile] = files.database;
        
        var options = {cache: cache}
        jsoncfg.loadFiles(TEST_DIR, options, function(err, files2) {
          EQ (files2.database.production.host, 'yourserver.com')
          done()
        }) 
      })
    })

    describe('> when a json transformer function is present', function() {
      it('should load the files and parse the json accordingly', function(done) {
        function parser (key, value) {
          if (typeof value !== 'string') return value;

          return ms(value) ? ms(value) : value
        }

        var opts = {transformer: parser}
        
        jsoncfg.loadFiles(TEST_DIR, opts, function(err, files) {
          EQ (files.shopping.timeout, 5000) //convert 5s to 5000
          done()
        }) 
      })
    })

    describe('> when the directory does not exist', function() {
      it('should still return an object and errors', function(done) {
        jsoncfg.loadFiles('/this/directory/does/not/exist', function(err, files, errInfo) {
          T (err)
          T (files)
          F (errInfo)

          EQ (files.get('config:production.port'), undefined)

          done()
        })
      })
    })
  })

  describe('+ loadFilesSync()', function() {
    it('should load the json files', function() {
      var files = jsoncfg.loadFilesSync(TEST_DIR)
        
      T (files.errors)
      T (files.errors.malformed)
      T (files.errors.malformed.message.indexOf("Unexpected token") >= 0)

      T (files.database)
      T (files.shopping)
      T (files['weird name2'])
      T (files['weird-name'])
      T (files.weird_name3)

      EQ (files.database.production.port, 27017)
    })

    describe('> when a cache is present', function() {
      it('should load the files when a cache is present', function() {
        var files = jsoncfg.loadFilesSync(TEST_DIR)

        EQ (files.database.production.host, 'myserver.com')
        files.database.production.host = 'yourserver.com'

        var dbFile = path.join(TEST_DIR, 'database.json')
        var cache = {}
        cache[dbFile] = files.database;

        var options = {cache: cache}
        var files2 = jsoncfg.loadFilesSync(TEST_DIR, options)

        EQ (files2.database.production.host, 'yourserver.com')        

      })
    })

    describe('> when the directory does not exist', function() {
      it('should still return an object and errors', function() {
        var files = jsoncfg.loadFilesSync('/this/directory/does/not/exist') 
        EQ (Object.keys(files.errors).length, 1)

        EQ (files.get('config:production.port'), undefined)
      })
    })

    describe('> when a json transformer function is present', function() {
      it('should load the files and parse the json files accordingly', function() {
        function parser (key, value) {
          if (typeof value !== 'string') return value;
          return ms(value) ? ms(value) : value
        }

        var opts = {transformer: parser}
        
        var files = jsoncfg.loadFilesSync(TEST_DIR, opts)
        EQ (files.shopping.timeout, 5000) //convert 5s to 5000
      })
    })
  })

  describe('- get()', function() {
    describe('> when field path is specified', function() {
      it('should retrieve the value', function(done) {
        var files = jsoncfg.loadFilesSync(TEST_DIR)

        EQ (files.database.get('production.host'), 'myserver.com')
        EQ (files.database.get('asdfasdfasdfa'), undefined) //doesn't exist

        EQ (files.database.get('production.host'), files.database.get('production:host'))

        //try async
        jsoncfg.loadFiles(TEST_DIR, function(err, data) {
          EQ (data.database.get('production.host'), 'myserver.com')
          done()
        })
      })
    })

    describe('> when called on the jsoncfg object', function() {
      it('should return the value from the file and field', function(done) {
        var files = jsoncfg.loadFilesSync(TEST_DIR)
        EQ (files.get('database:production.host'), 'myserver.com')

        jsoncfg.loadFiles(TEST_DIR, function(err, data) {
          EQ (data.get('database:production.host'), 'myserver.com')
          done()
        })
      })
    })
  })

  describe('- set()', function() {
    describe('> when a a field path is specified', function() {
      it('should set the value', function() {
        var files = jsoncfg.loadFilesSync(TEST_DIR)

        EQ (files.database.production.host, 'myserver.com')
        EQ (files.database.set('production.host', 'yourserver.com'), 'myserver.com')
        EQ (files.database.production.host, 'yourserver.com')

        EQ (files.database.set('production.doesnotexist', 'nope'), undefined)
        EQ (files.database.production.doesnotexist, 'nope')

        EQ (files.database.set('production.location.short', 'US'), undefined)
        EQ (files.database.production.location.short, 'US')

        EQ (files.database.set('production.name.something.special', 'superman'), undefined)
        EQ (files.database.production.name.something.special, 'superman')
      })

    })
  })

  describe('- getPath()', function() {
    it('should return the full path that the file was load from', function(done) {
      var files = jsoncfg.loadFilesSync(TEST_DIR)

      EQ (files.database.getPath(), path.join(TEST_DIR, 'database.json'))

      jsoncfg.loadFiles(TEST_DIR, function(err, files) {
        EQ (files.database.getPath(), path.join(TEST_DIR, 'database.json'))
        done()
      })
    })
  })
})


