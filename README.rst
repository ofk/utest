JavaScript Unit Test
====================

About
-----

This is unit test module for JavaScript.
This supports a old browser (ex. IE5.x).

Usage
-----

Executes tests:

::

  utest('Tests (Function & Array)', function (regist) {
    //   :
    // setup
    //   :
    regist([
      "true test", function () { var val = true; return val; },
      "same test", function () { var val = 'ok'; return [ val, 'ok' ]; },
      "diff test", function () { var val = '1'; return [ val, '!==', 1 ]; },
      "safe test", utest.safe(function () { parseInt('0'); }),
      "raise test", utest.raise(function () { typo('0'); }),
      "anonymous tests", function (test) { test(true); test([ true ]); test([ 1, 1 ]); test([ 2, '==', '2' ]); },
      "autonym tests 1", function (test) { test('a', true); test('b', [ true ]); test('c', [ 1, 1 ]); test('d', [ 2, '==', '2' ]); },
      "autonym tests 2", function (test) { test('a')(true); test('b')([ true ]); test('c')([ 1, 1 ]); test('d')([ 2, '==', '2' ]); },
      "auto naming tests", function () { return utest.multi(true, [ true ], [ 1, 1 ], [ 2, '==', '2' ]); },
      "naming tests", function () { return { a: true, b: [ true ], c: [ 1, 1 ], d: [ 2, '==', '2' ] }; },
      "delay test 1", function (test) {
        setTimeout(function () {
          test(true);
          setTimeout(function () { test([ 1, 1 ]); }, 200);
        }, 100);
      },
      "delay test 2", function (test) {
        var test1 = test(), test2 = test();
        setTimeout(function () {
          test1(true);
          setTimeout(function () { test2([ 1, 1 ]); }, 200);
        }, 100);
      },
      "delay test 3", function (test) {
        var test1 = test(), test2 = test();
        test1(true, 100, function () {
          test2([ 1, 1 ], 200);
        });
      },
      "delay test 4", function (test) {
        test(true, 100);
        test([ 1, 1 ], 300);
      },
      "naming delay test 1", function (test) {
        var test1 = test('test1'), test2 = test('test2');
        test1(true, 100, function () {
          test2([ 1, 1 ], 200);
        });
      },
      "naming delay test 2", function (test) {
        test('test1', true, 100);
        test('test2')([ 1, 1 ], 300);
      }
    ], function () {
      //   :
      // teardown
      //   :
    });
  });

  utest('Tests (Function & Object & Fail)', function () {
    return {
      wrong1: function () { return false },
      wrong2: function () { return utest.multi([ false, true ], [ true, true ]); },
      wrong3: function (test) { test(true); test(false); },
      wrong4: function (test) { test(true, 100); test([ 1, 2 ], 200); },
      error1: function ()  { typo(); },
      error2: function ()  { throw new Error; }
    };
  });

  utest('Tests (Array & Unscope)', [
    function () { return [ 'auto naming', 'auto naming' ]; },
    'naming 1', function () { return [ 'array name', 'array name' ]; },
    [ 'auto naming', 'auto naming' ],
    function naming2() { return [ 'function name', 'function name' ]; },
    'naming 3', [ 'array name', 'array name' ],
    true,
    "same test", [ 'ok', 'ok' ],
    "diff test", [ '1', '!==', 1 ],
    "auto naming tests", utest.multi(true, [ true ], [ 1, 1 ], [ 2, '==', '2' ]),
    "naming tests", { a: true, b: [ true ], c: [ 1, 1 ], d: [ 2, '==', '2' ] }
  ]);

  utest('Tests (Object & Unscope & Fail)', {
    wrong1: false,
    wrong2: utest.multi([ false, true ], [ true, true ])
  });
