EIDB.LOG_ERRORS = false;

asyncTest('EIDB.errors - ObjectStore', function() {
  expect(5);

  EIDB.open('foo', 1, function(db) {
    var store = db.createObjectStore('bar');

    store.index('by_nom');
    ok(EIDB.error.error instanceof DOMException, "index error is caught");

    store.createIndex('by_name', 'name');
    ok(!EIDB.error, "EIDB.error is cleared after the next direct indexedDB request");

    store.createIndex('by_name', 'name');
    ok(EIDB.error.error instanceof DOMException, "createIndex error is caught");

    store.deleteIndex('by_nom');
    ok(EIDB.error.error instanceof DOMException, "deleteIndex error is caught");

    start();
  });

  stop();
  EIDB.open('foo2', null, function(db) {
    db.createObjectStore('bar', {autoIncrement: true});
  }, {keepOpen: true}).then(function(db) {

    var store = db.objectStore('bar');
    db.close();

    store.insertWith_key('add', {name: 'baz'}, null, db).then(function() {

      ok(EIDB.error.error instanceof DOMException, "insertWith_key error is caught");
      start();
    });
  });
});

asyncTest('EIDB.errors - utils', function() {
  expect(4);

  EIDB.createObjectStore('foo', 'bar').then(function(db) {
    EIDB.error = 'foo';
    var store = db.objectStore('bar');

    store.add().then(function() {
      ok(EIDB.error.error instanceof Object, "_request error is caught");

      var _store = db.transaction('bar', 'readwrite').objectStore('bar');
      return _store.add({a:1}, 1);
    }).then(function() {

      ok(!EIDB.error, "EIDB.error is cleared after next _request");
      start();
    });
  });

  stop();
  EIDB.open('foo2', 1, function(db) {
    EIDB.error = 'foo';

    var store = db.createObjectStore('bar');

    store.openCursor(null, 'errrrr').then(function() {
      ok(EIDB.error.error instanceof Object, "_openCursor error is caught");

      return store.openCursor('eh', null, function(cursor, resolve) {
        resolve();
      });
    }).then(function() {

      ok(!EIDB.error, "EIDB.error is cleared after next _openCursor");
      start();
    });
  });
});

// Database#close not tested, but error handling implement
asyncTest('EIDB.errors - Database', function() {
  expect(3);

  EIDB.open('foo', 1, function(db) {
    db.createObjectStore("people");
    db.createObjectStore('people');
    ok(EIDB.error.error instanceof DOMException, "createObjectStore error is caught");

    db.deleteObjectStore('dogs');
    ok(EIDB.error.error instanceof DOMException, "deleteObjectStore error is caught");

    db.transaction('nope');
    ok(EIDB.error.error instanceof DOMException, "transaction error is caught");


    start();
  });
});

asyncTest('EIDB.errors - Transaction', function() {
  expect(1);
  var tx;

  EIDB.createObjectStore('foo', 'bar').then(function(db) {
    tx = db.transaction('bar', 'readwrite');
    tx.objectStore('bar').add({a:1});

    tx._idbTransaction.oncomplete = function() {
      tx.abort();

      ok(EIDB.error.error instanceof DOMException, "abort error is caught");
      start();
    }
  });
});

asyncTest('EIDB.errors - .open', function() {
  expect(3);

  EIDB.open('foo', 1).then(function() {
    return EIDB.open('foo', -1);
  }).then(function() {
    ok(EIDB.error.error instanceof Object, "open error is caught");

    return EIDB.open('foo', 2);
  }).then(function() {

    ok(!EIDB.error, "EIDB.error is cleared after the next .open request");

    EIDB.error = {};
    EIDB.open('foo', 3, function(db) {

      ok(!EIDB.error, "EIDB.error is cleared after the next onupgradeneeded .open request");
      start();
    });
  });
});

asyncTest('EIDB.registerErrorHandler - RSVP error', function() {
  expect(1);

  EIDB.registerErrorHandler(function(err) {
    ok(err, "RSVP error was received by the handler");

    start();
    EIDB.registerErrorHandler.clearHandlers();
  });

  EIDB.open('foo', -1);

});

asyncTest('EIDB.registerErrorHandler - _request error', function() {
  expect(1);

  EIDB.registerErrorHandler(function(err) {
    ok(err, "Request error was received by the handler");

    start();
    EIDB.registerErrorHandler.clearHandlers();
  });

  EIDB.createObjectStore('foo', 'storez', {keyPath: 'id'}).then(function(db) {
    var store = db.objectStore('storez');
    store.add(1, 1);
  });

});