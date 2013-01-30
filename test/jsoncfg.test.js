var jsoncfg = require('../lib/jsoncfg')
  , testutil = require('testutil')
  , fs = require('fs-extra')
  , path = require('path')
  , P = require('autoresolve')

var TEST_DIR = ''

describe('jsoncfg', function() {
  beforeEach(function(done) {
    TEST_DIR = testutil.createTestDir('jsoncfg')
    fs.copy(P('test/resources/config'), TEST_DIR, function(err) {
      if (err && err.length > 0) done(err[0])
      done()
    })
  })

  describe('+ loadFiles', function() {
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
  })

  describe('+ loadFilesSync', function() {
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
  })

  describe('- get', function() {
    describe('> when field path is specified', function() {
      it('should retrieve the value', function(done) {
        var files = jsoncfg.loadFilesSync(TEST_DIR)

        console.log('GS: ' + typeof files.database.get)

        EQ (files.database.get('production.host'), 'myserver.com')
        EQ (files.database.get('asdfasdfasdfa'), undefined) //doesn't exist

        EQ (files.database.get('production.host'), files.database.get('production:host'))

        //try async
        jsoncfg.loadFiles(TEST_DIR, function(err, data) {
          EQ (files.database.get('production.host'), 'myserver.com')
          done()
        })
      })
    })
  })

  describe('- set', function() {
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
})


