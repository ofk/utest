/**
 * @fileOverview
 *   ブラウザ上での簡易ユニットテストライブラリ
 * @author <a href="http://0fk.org/">ofk</a>
 * @version 0.1
 * @license
 *   utest.js (c) 2012 ofk
 *   utest.js is licensed under the MIT.
 */

/** @namespace */
var utest = (function (window, document, setTimeout, clearTimeout) {
  /**
   * utestを実行する
   * @param {String} [name] テスト名。省略可能
   * @param {Object|Array|Function} tests テストセット。関数の場合はテストセットを返す、もしくは第一引数の登録関数で登録する
   * @param {Number} [delay] 遅延秒数
   * @param {Number} [timeout] 次のテストセットを強制的に実行するまでの秒数
   * @return {utest.Test} テストオブジェクト
   * @example
   *  utest('Tests (Function & Array)', function (regist) {
   *    //   :
   *    // setup
   *    //   :
   *    regist([
   *      "true test", function () { var val = true; return val; },
   *      "same test", function () { var val = 'ok'; return [ val, 'ok' ]; },
   *      "diff test", function () { var val = '1'; return [ val, '!==', 1 ]; },
   *      "safe test", utest.safe(function () { parseInt('0'); }),
   *      "raise test", utest.raise(function () { typo('0'); }),
   *      "anonymous tests", function (test) { test(true); test([ true ]); test([ 1, 1 ]); test([ 2, '==', '2' ]); },
   *      "autonym tests 1", function (test) { test('a', true); test('b', [ true ]); test('c', [ 1, 1 ]); test('d', [ 2, '==', '2' ]); },
   *      "autonym tests 2", function (test) { test('a')(true); test('b')([ true ]); test('c')([ 1, 1 ]); test('d')([ 2, '==', '2' ]); },
   *      "auto naming tests", function () { return utest.multi(true, [ true ], [ 1, 1 ], [ 2, '==', '2' ]); },
   *      "naming tests", function () { return { a: true, b: [ true ], c: [ 1, 1 ], d: [ 2, '==', '2' ] }; },
   *      "delay test 1", function (test) {
   *        setTimeout(function () {
   *          test(true);
   *          setTimeout(function () { test([ 1, 1 ]); }, 200);
   *        }, 100);
   *      },
   *      "delay test 2", function (test) {
   *        var test1 = test(), test2 = test();
   *        setTimeout(function () {
   *          test1(true);
   *          setTimeout(function () { test2([ 1, 1 ]); }, 200);
   *        }, 100);
   *      },
   *      "delay test 3", function (test) {
   *        var test1 = test(), test2 = test();
   *        test1(true, 100, function () {
   *          test2([ 1, 1 ], 200);
   *        });
   *      },
   *      "delay test 4", function (test) {
   *        test(true, 100);
   *        test([ 1, 1 ], 300);
   *      },
   *      "naming delay test 1", function (test) {
   *        var test1 = test('test1'), test2 = test('test2');
   *        test1(true, 100, function () {
   *          test2([ 1, 1 ], 200);
   *        });
   *      },
   *      "naming delay test 2", function (test) {
   *        test('test1', true, 100);
   *        test('test2')([ 1, 1 ], 300);
   *      }
   *    ], function () {
   *      //   :
   *      // teardown
   *      //   :
   *    });
   *  });
   *
   *  utest('Tests (Function & Object & Fail)', function () {
   *    return {
   *      wrong1: function () { return false },
   *      wrong2: function () { return utest.multi([ false, true ], [ true, true ]); },
   *      wrong3: function (test) { test(true); test(false); },
   *      wrong4: function (test) { test(true, 100); test([ 1, 2 ], 200); },
   *      error1: function ()  { typo(); },
   *      error2: function ()  { throw new Error; }
   *    };
   *  });
   *
   *  utest('Tests (Array & Unscope)', [
   *    function () { return [ 'auto naming', 'auto naming' ]; },
   *    'naming 1', function () { return [ 'array name', 'array name' ]; },
   *    [ 'auto naming', 'auto naming' ],
   *    function naming2() { return [ 'function name', 'function name' ]; },
   *    'naming 3', [ 'array name', 'array name' ],
   *    true,
   *    "same test", [ 'ok', 'ok' ],
   *    "diff test", [ '1', '!==', 1 ],
   *    "auto naming tests", utest.multi(true, [ true ], [ 1, 1 ], [ 2, '==', '2' ]),
   *    "naming tests", { a: true, b: [ true ], c: [ 1, 1 ], d: [ 2, '==', '2' ] }
   *  ]);
   *
   *  utest('Tests (Object & Unscope & Fail)', {
   *    wrong1: false,
   *    wrong2: utest.multi([ false, true ], [ true, true ])
   *  });
   */
  function utest() {
    // テストを行うかどうかの判定
    if (!utest.enable) return null;

    // 引数を配列に変換
    var args = Array.prototype.slice.call(arguments), type_args_0 = utest.type(args[0]);
    // args[0]: 名前の省略の修正
    if (type_args_0 === 'array' ||
        type_args_0 === 'object' ||
        type_args_0 === 'function') {
      args.unshift(null);
    }
    // テストオブジェクトの生成
    return new utest.Test(args[0], args[1], args[2], args[3]);
  }

  /**
   * utestを実行するかどうか
   * @type Boolean
   */
  utest.enable = true;

  /**
   * utest.Testが呼ばれた回数
   * @type Number
   */
  utest.count = 0;

  /**
   * テスト自体の個数
   * @type Number
   */
  utest.total = 0;

  // -----------------------------------------------------------------------------

  /**
   * オブジェクトの型の判定
   * @param {mixed} obj 型を判定したいオブジェクト
   * @returns {String} 判定された型
   * @link <a href="http://d.hatena.ne.jp/uupaa/20091006/1254926477">uupaaさんのtype detectionを参考</a>
   */
  utest.type = function type(obj) {
    var t = typeof obj;
    return utest_type_values[t] || (t = utest_type_values[utest_type_detector.call(obj)]) ? t :
      !obj           ? 'null' :
      obj.setTimeout ? 'window' :
      obj.nodeType   ? 'node' :
      'length' in obj && typeof (t = obj.length) === 'number' && (!t || t - 1 in obj) ? 'array' : 'object';
  };
  // 結果を適切な値に変換するテーブル
  var utest_type_values = {
    'undefined':         1,
    'boolean':           1,
    'number':            1,
    'string':            1,
    '[object Boolean]':  'boolean',
    '[object Number]':   'number',
    '[object String]':   'string',
    '[object RegExp]':   'regexp',
    '[object Array]':    'array',
    '[object Function]': 'function',
    '[object Date]':     'date'
  },
  // 型判定用メソッド
  utest_type_detector = Object.prototype.toString;

  /**
   * オブジェクトのダンプ
   * @param {mixed} obj ダンプしたいオブジェクト
   * @param {String} [indent] インデントに利用する文字列
   * @returns {String} ダンプした結果文字列
   */
  utest.dump = function dump(obj, indent) {
    // インデントを設定する
    indent = indent || dump.indent || '  ';

    var rv = utest.type(obj), arr = [],
        // 折り返す文字列の上限
        maxLength = dump.maxLength || 16;

    // 型ごとに結果を分岐する
    switch (rv) {
    case 'boolean':
    case 'number':
    case 'regexp':
    case 'date':
    case 'function':
      rv = '' + obj;
      break;
    case 'string':
      rv = "'" + obj.replace(/\\/g, '\\\\')
                    .replace(/'/g,  "\\'")
                    .replace(/\r/g, '\\r')
                    .replace(/\n/g, '\\n') + "'";
      break;
    case 'node':
      rv = obj.nodeType === 9 ? 'document'
                              : '<' + (obj.tagName ? obj.tagName.toLowerCase() : '#text') + '>';
      break;
    case 'array':
    case 'object':
      // インデントの処理の兼ね合いで処理が似ている
      var b_open, b_close;
      // 配列的オブジェクト
      if (rv === 'array') {
        b_open = '['; b_close = ']';
        // 値を列挙する
        var isSome = false;
        for (var i = 0, iz = obj.length; i < iz; ++i) {
          if (i in obj) {
            isSome = true;
            arr[i] = dump(obj[i], indent);
          }
          else {
            arr[i] = '';
          }
        }
        // 一つ以上値が存在する
        if (!isSome) {
          arr = [];
        }
      }
      // ハッシュオブジェクト
      else {
        b_open = '{'; b_close = '}';
        // 独自のtoStringは活用する
        if (obj.toString !== Object.prototype.toString &&
          utest.type(obj.toString) === 'function') {
          return obj.toString();
        }
        // 値を列挙する
        var reg_key = /^[a-z_$][a-z0-9_$]*$/i, q = -1;
        for (var k in obj) {
          arr[++q] = (reg_key.test(k) ? k : dump(k, indent)) + ': ' + dump(obj[k], indent);
        }
      }
      // 文字列を生成する
      if (arr.length) {
        rv = b_open + ' ' + arr.join(', ') + ' ' + b_close;
        if (rv.length > maxLength) {
          rv = b_open + ('\n' + arr.join(',\n')).replace(/\n/g, '\n' + indent) + '\n' + b_close;
        }
      }
      // 空のオブジェクト
      else {
        rv = b_open + b_close;
      }
      break;
    }

    return rv;
  };

  // -----------------------------------------------------------------------------

  // トリム用正規表現と分割用正規表現
  var reg_trim = /^\s+|\s+$/g, reg_space = /\s+/;

  /**
   * ノードにprependする
   * @param {Node} node 親ノード
   * @param {Node|String} elem 挿入したいデータ
   * @return {Node} 親ノード
   */
  utest.prepend = function prepend(node, elem) {
    return node.insertBefore(elem.nodeType ? elem : utest.text(elem), node.firstChild);
  };

  /**
   * ノードにappendする
   * @param {Node} node 親ノード
   * @param {Node|String} elem 挿入したいデータ
   * @return {Node} 親ノード
   */
  utest.append = function append(node, elem) {
    return node.appendChild(elem.nodeType ? elem : utest.text(elem));
  };

  /**
   * テキストノードの生成
   * @param {String} text 文字列
   * @return {Node} テキストノード
   */
  utest.text = function text(text) {
    return document.createTextNode(text);
  };

  /**
   * ノードの生成
   * @param {String} tag タグ名
   * @param {Object} [attr] 属性オブジェクト
   * @param {String} [text] 挿入テキスト
   * @return {Node} 生成されたノード
   */
  utest.$N = function $N(tag, attr, text) {
    var elem = document.createElement(tag);
    if (attr) {
      for (var i in attr) {
        elem[i] = attr[i];
      }
    }
    if (text) {
      elem.appendChild(utest.text(text));
    }
    return elem;
  };

  /**
   * スタイルシートの設定
   * @param {String} styles スタイルシート文字列
   */
  utest.setStyleSheet = function setStyleSheet(styles) {
    if (document.createStyleSheet && !document.querySelector) {
      // [IE マジ天使] IE8では動作しなくなった！　良かったね！
      document.createStyleSheet("javascript:'" + styles + "'");
    }
    else {
      utest.append(
        document.documentElement.firstChild,
        utest.$N('link', { rel: 'stylesheet', href: 'data:text/css,' + escape(styles) })
      );
    }
  };

  /**
   * ノードとのデータの結びつけ
   * @param {Node} node ノード
   * @param {String} name キー
   * @param {mixed} value データ
   * @return {Node} ノード
   */
  utest.dataset = function dataset(node, name, value) {
    if (value == null) {
      return node.getAttribute('data-' + name);
    }
    node.setAttribute('data-' + name, value);
    return node;
  };

  /**
   * クラスの追加
   * @param {Node} node ノード
   * @param {String} className 追加したいクラス名
   * @return {Node} ノード
   */
  utest.addClass = function addClass(node, className) {
    className = className.replace(reg_trim, '');
    if (node.className) {
      utest.hasClass(node, className) || (node.className += ' ' + className);
    }
    else {
      node.className = className;
    }
    return node;
  };

  /**
   * クラスの削除
   * @param {Node} node ノード
   * @param {String} className 削除したいクラス名
   * @return {Node} ノード
   */
  utest.removeClass = function removeClass(node, className) {
    className = className.replace(reg_trim, '');
    var node_classNames = node.className.replace(reg_trim, '').split(reg_space);
    for (var i = node_classNames.length - 1; i >= 0; --i) {
      if (node_classNames[i] === className) {
        node_classNames.splice(i, 1);
        break;
      }
    }
    node.className = node_classNames.join(' ');
    return node;
  };

  /**
   * クラスがあるかどうか
   * @param {Node} node ノード
   * @param {String} className チェックするクラス名
   * @return {boolean} クラスがあるかどうか
   */
  utest.hasClass = function hasClass(node, className) {
    className = ' ' + className.replace(reg_trim, '') + ' ';
    return (' ' + node.className + ' ').replace(reg_space, ' ').indexOf(className) > -1;
  };

  /**
   * イベントの追加
   * @param {Node} node ノード
   * @param {String} type イベント名
   * @param {Function} func 登録関数
   * @return {Function} 実際に登録したプロキシ関数
   */
  utest.addEvent = function addEvent(node, type, func) {
    function proxy(evt) {
      evt = evt || window.event;
      if (func(evt, evt.target || evt.srcElement) === false) {
        evt.preventDefault  ? evt.preventDefault()  : (evt.returnValue  = false);
        evt.stopPropagation ? evt.stopPropagation() : (evt.cancelBubble = false);
      }
    };
    node.addEventListener ? node.addEventListener(type, proxy, false)
                          : node.attachEvent('on' + type, proxy);
    return proxy;
  };

  /**
   * イベントの削除
   * @param {Node} node ノード
   * @param {String} type イベント名
   * @param {Function} proxy 削除する関数（プロキシ関数）
   */
  utest.removeEvent = function removeEvent(node, type, proxy) {
    node.removeEventListener ? node.removeEventListener(type, proxy, false)
                             : node.detachEvent('on' + type, proxy);
  };

  // -----------------------------------------------------------------------------

  // テストクラス
  // docコメントを使うため、ここには定義しない
  utest.Test = function Test() {
    utest.Test.init && utest.Test.init.apply(utest.Test, arguments);
    this.init && this.init.apply(this, arguments);
  };

  // 自分を返す関数を生成
  function self(obj) {
    return function () { return obj; };
  }

  /**
   * 全体の初期化関数。一度しか呼ばれない
   */
  utest.Test.init = function init() {
    // 呼び出しは一度
    utest.Test.init = null;
    // スタイルを設定
    utest.setStyleSheet([
      'body, h1, h2, p { margin: 0; padding: 0; }',
      'body { padding: 10px; }',
      'h1 { background: #069; font-size: 120%; color: #fff; padding: 2px 5px; }',
      'h2 { background: #eee; font-size: 85%; padding: 2px 5px; cursor: pointer; }',
      'h2::before { content: "\\25be"; display: inline-block; width: 1em; }',
      '.utests-close h2::before { content: "\\25b8"; }',
      'h2 .stand { color: yellow; }',
      'h2 .right { color: green; }',
      'h2 .wrong { color: red; }',
      'p { margin: 5px 0 10px; }',
      '.utests-close p { display: none; }',
      'p span { display: inline-block; padding: 2px; color: #fff; font-size: 85%; cursor: pointer; }',
      'p span.stand { background: yellow; color: #000; }',
      'p span.right { background: green; }',
      'p span.wrong { background: red; font-size: 100%; }'
    ].join(''));

    // ノードを生成
    utest.Test._root = utest.prepend(
      document.body,
      utest.$N('div', { id: 'utest' })
    );
    utest.append(
      utest.Test._root,
      utest.$N('h1', {}, document.title)
    );

    // トリガー方式でイベントを設定
    utest.addEvent(utest.Test._root, 'click', function (evt, elem) {
      // titleのポップアップ
      if (elem.title) {
        alert(elem.title);
        return;
      }
      do {
        // テストの開閉
        if (elem.tagName === 'H2') {
          var parent = elem.parentNode;
          utest[utest.hasClass(parent, 'utests-close') ? 'removeClass' : 'addClass'](parent, 'utests-close');
          return;
        }
      } while ((elem = elem.parentNode));
    });
  };

  utest.Test.prototype = /** @lends utest.Test# */ {
    /**
     * コンストラクター
     * @constructs
     * @param {String} name テスト名。nullだと自動設定
     * @param {Object|Array|Function} tests テストセット。関数の場合はテストセットを返す
     * @param {Number} [delay=0] 遅延秒数
     * @param {Number} [timeout=0] 次のテストセットを強制的に実行するまでの秒数
     */
    init: function init(name, tests, delay, timeout) {
      // テスト設定が関数かどうか
      var type_tests_is_function = utest.type(tests) === 'function';

      // プロパティの設定
      this.count = utest.count;
      this.count_stand = 0;
      this.count_right = 0;
      this.count_wrong = 0;
      this.count_total = 0;
      this.name = name = name || (type_tests_is_function && tests.name) || 'Test ' + this.count;
      this.delay = +delay;
      this.timeout = +timeout || (this.delay || 1) * 10;

      // コンテナの設定
      var div = utest.append(
        utest.Test._root,
        utest.$N('div', { className: 'utests utests-close', id: 'utests' + (++utest.count) })
      );
      this.header = utest.append(div, utest.$N('h2', {}, name));
      this.result = utest.append(div, utest.$N('p'));

      // テスト関数に変形
      if (!type_tests_is_function) {
        tests = self(tests);
      }
      // テストの実行
      var that = this;
      try {
        var res = tests(function (tests, comp) {
          that.setup(tests, comp);
        });
        // functionで第一引数を使って定義した場合、undefinedを返す場合がある
        res && this.setup(res);
      } catch (e) {
        utest.addClass(div, 'utests-error');
        throw e; // FIXME
      }
    },
    /**
     * テストの設定と実行
     * @param {Array|Object} tests テストセット
     * @param {Function} [comp] テストの実行後に呼ばれる関数
     */
    setup: function setup(tests, comp) {
      // テストセットの正規化
      var type_tests = utest.type(tests);
      if (type_tests === 'array') {}
      else if (type_tests === 'object') {
        // オブジェクト形式を配列形式に改める
        var arr = [], q = -1;
        for (var k in tests) {
          arr[++q] = k;
          arr[++q] = tests[k];
        }
        tests = arr;
      }
      else {
        throw new TypeError('Test type of undefined is not support.');
      }

      if (utest.type(comp) !== 'function') {
        comp = null;
      }

      // テストを実行する
      var that = this;
      function run(i, tests, comp) {
        switch (utest.type(tests[i])) {
        case 'boolean':
        case 'array':
        case 'object':
          // テスト関数への変換
          tests[i] = self(tests[i]);
          // fall through
        case 'function':
          var test = tests[i];
          that.test(utest.type(tests[i - 1]) !== 'function' ? tests[i - 1] : test.name || null, test, comp);
          return true;
        default:
          return false;
        }
      }

      // 非同期テスト
      if (this.delay) {
        var delay = this.delay, timeout = this.timeout;
        (function loop(i) {
          // ループの終了
          if (i >= tests.length) {
            comp && comp.call(this);
            return;
          }
          // 準備
          var called = false, tid_timeout, tid_delay;
          function next() {
            if (called) return;
            called = true;
            clearTimeout(tid_timeout);
            clearTimeout(tid_delay);
            loop(i + 1);
          }
          // 実行
          var res = run(i, tests, function () {
            if (called) return;
            clearTimeout(tid_delay);
            tid_delay = setTimeout(next, delay);
          });
          if (res) {
            tid_timeout = setTimeout(next, timeout);
          }
          else {
            loop(i + 1);
          }
        }(0));
      }
      // 同期テスト
      else {
        for (var i = 0, iz = tests.length; i < iz; ++i) {
          run(i, tests);
        }
        comp && comp.call(this);
      }
    },
    /**
     * テストの実行
     * @param {String} name テスト名
     * @param {Function} test テスト関数
     * @param {Function} [comp] テスト終了関数
     */
    test: function test(name, test, comp) {
      if (utest.type(comp) !== 'function') {
        comp = null;
      }

      // カウンタの実行
      ++utest.total;
      ++this.count_total;
      ++this.count_stand;

      // ノード生成
      var span = utest.append(
        this.result,
        utest.$N('span', { className: 'stand' }, name || 'test ' + this.count_total)
      );
      utest.dataset(span, 'pending', 0);
      utest.append(this.result, ' ');

      // テスト実行関数の生成関数
      var that = this;
      function create_test(name, res, delay, local_comp) {
        var type_name = utest.type(name);
        if (type_name === 'boolean' ||
          type_name === 'array' ||
          type_name === 'object') {
          local_comp = delay;
          delay = res;
          res = name;
          name = null;
        }
        if (res != null) {
          return create_test(name)(res, delay, local_comp);
        }

        utest.dataset(span, 'pending', +utest.dataset(span, 'pending') + 1);
        // 現在のテストの状態
        var state = (/wrong|right/.exec(span.className) || [ 'stand' ])[0];
        if (state === 'right') {
          --that.count_right;
          ++that.count_stand;
          span.className = 'stand';
        }
        function exec_test(res, delay, local_comp) {
          // 遅延評価
          if (delay) {
            return setTimeout(function () {
              exec_test(res, null, local_comp);
            }, delay);
          }
          utest.dataset(span, 'pending', +utest.dataset(span, 'pending') - 1);
          var ret = that._test(span, name, res);
          local_comp && local_comp();
          comp && comp();
          return ret;
        }
        return exec_test;
      }

      // テストの実行
      var res;
      try {
        res = test(create_test);
      } catch (e) {
        create_test()({ error: e });
        return;
      }

      // テスト結果の解析
      if (utest.type(res) === 'object') {
        var is_array = true, count = -1, k;
        for (k in res) {
          if (k != ++count) {
            is_array = false;
            break;
          }
        }
        for (k in res) {
          create_test(is_array ? void 0 : '' + k)(res[k]);
        }
      }
      else if (res != null) {
        create_test()(res);
      }
    },
    /**
     * テスト結果の画面への反映
     * @param {Node} span
     * @param {mixed} res
     *        Object: { expr: mixed, [error: object], [name: string], [delay: number] }
     *        Array: -> { expr: Array }
     *        boolean: -> { expr: boolean }
     */
    _test: function _test(span, name, res) {
      // 通常の評価
      res = utest.judge(res);
      if (!res) {
        utest.dataset(span, 'pending', +utest.dataset(span, 'pending') + 1);
        return;
      }

      // テストの名称
      if (name) {
        res.name = name;
      }

      // 現在のテストの状態
      var state = (/wrong|right/.exec(span.className) || [ 'stand' ])[0];

      // テストの結果
      switch (res.result) {
      case false:
        if (state !== 'wrong') {
          --this['count_' + state];
          ++this.count_wrong;
          span.className = 'wrong';
          utest.removeClass(this.result.parentNode, 'utests-close');
        }
        break;
      case true:
        if (state === 'stand' && !+utest.dataset(span, 'pending')) {
          --this.count_stand;
          ++this.count_right;
          span.className = 'right';
        }
        break;
      default:
        return;
      }
      var message = (res.name ? res.name + '> ' : '') + res.message;
      span.title ? (span.title += '\n' + (res.result ? '' : '[!] ') + message) : (span.title = message);

      this.header.innerHTML = [
        this.name,
        ' ( ',
        '<span class="right">', this.count_right, '</span> / ',
        '<span class="wrong">', this.count_wrong, '</span> / ',
        // '<span class="stand">', this.count_stand, '</span> / ',
        '<span class="total">', this.count_total, '</span>',
        ' )'
      ].join('');
    }
  };

  // -----------------------------------------------------------------------------

  /**
   * 実行結果の評価
   * @param {Object} res
   * @return {Object}
   */
  utest.judge = function judge(res) {
    if (res == null) {
      return null;
    }
    if (utest.type(res) !== 'object') {
      res = { expr: res };
    }
    if (res.error) {
      res.result = false;
      res.message = res.error;
      return res;
    }
    var expr = res.expr;
    var type_expr = utest.type(expr);
    if (type_expr === 'boolean') {
      res.result = expr;
      res.message = utest.message(expr);
      return res;
    }
    if (type_expr !== 'array') {
      return null;
    }
    switch (expr.length) {
    case 0:
      return null;
    case 1:
      res.result = !!utest.op['==='](expr[0], true);
      res.message = utest.message(expr[0]);
      break;
    case 2:
      res.result = !!utest.op['==='](expr[0], expr[1]);
      res.message = utest.message(expr[0], '===', expr[1]);
      break;
    default:
      res.result = expr[1] in utest.op ? utest.op[expr[1]](expr[0], expr[2]) : false;
      res.message = utest.message(expr[0], expr[1], expr[2]);
      break;
    }
    return res;
  };

  /**
   * 評価結果を構築する
   * @param {Object} v1 一つ目の値
   * @param {String} [op] 演算子
   * @param {Object} [v2] 二つ目の値
   * @return {String}
   */
  utest.message = function message(v1, op, v2) {
    return op ? [
      '(' + utest.type(v1) + ')', utest.dump(v1),
      op,
      '(' + utest.type(v2) + ')', utest.dump(v2)
    ].join(' ') : '(' + utest.type(v1) + ') ' + utest.dump(v1);
  };

  /**
   * オペレータの設定
   * @type Object
   */
  utest.op = {
    '===': function (v1, v2) {
      var t1 = utest.type(v1), t2 = utest.type(v2);
      if (t1 !== t2) {
        return false;
      }
      if (t1 === 'null' || t1 === 'undefined') {
        return true;
      }
      if (utest.type(v1.equals) === 'function' && utest.type(v2.equals) === 'function') {
        return v1.equals(v2) && v2.equals(v1);
      }
      switch (t1) {
      case 'array':
        if (v1.length !== v2.length) {
          return false;
        }
        for (var i = 0, iz = v1.length; i < iz; ++i) {
          var i_in_v1 = i in v1, i_in_v2 = i in v2;
          if (i_in_v1 !== i_in_v2) {
            return false;
          }
          if (i_in_v1 && i_in_v2) {
            if (!utest.op['==='](v1[i], v2[i])) return false;
          }
        }
        return true;
      case 'object':
        var k;
        for (k in v1) {
          if (!utest.op['==='](v1[k], v2[k])) return false;
        }
        for (k in v2) {
          if (!utest.op['==='](v1[k], v2[k])) return false;
        }
        return true;
      }
      return v1 === v2;
    },
    '==':  function (v1, v2) { return v1 == v2; },
    '!==': function (v1, v2) { return !utest.op['==='](v1, v2); },
    '!=':  function (v1, v2) { return v1 != v2; },
    '>':   function (v1, v2) { return v1 >  v2; },
    '>=':  function (v1, v2) { return v1 >= v2; },
    '<':   function (v1, v2) { return v1 <  v2; },
    '<=':  function (v1, v2) { return v1 <= v2; },
    '=~':  function (v1, v2) {
      switch (utest.type(v2)) {
      case 'array':
        for (var i = 0, iz = v2.length; i < iz; ++i) {
          if (utest.op['==='](v1, v2[i])) return true;
        }
        break;
      case 'object':
        for (var k in v2) {
          if (utest.op['==='](v1, v2[k])) return true;
        }
        break;
      case 'regexp':
        return v2.test(v1);
      case 'string':
      case 'number':
        switch (utest.type(v1)) {
        case 'string':
        case 'number':
          return ('' + v1).indexOf(v2) > -1;
        default:
          return v2 in v1;
        }
      }
      return false;
    },
    '!~': function (v1, v2) { return !utest.op['=~'](v1, v2); }
  };

  // -----------------------------------------------------------------------------

  /**
   * 複数テスト実行コンテナ
   * @return {Object}
   */
  utest.multi = function () {
    // 配列ではなくオブジェクトに連番の格納を行う
    var obj = {}, args = arguments;
    for (var i = 0, iz = args.length; i < iz; ++i) {
      obj[i] = args[i];
    }
    return obj;
  };

  /**
   * エラーが投げられないことを保証するテストの生成
   * @param {Function} fn
   * @return {Function}
   */
  utest.safe = function (fn) {
    return function (test) {
      var res = fn.apply(this, arguments);
      test(true);
      return res;
    };
  };

  /**
   * エラーが投げられることを保証するテストの生成
   * @param {Function} fn
   * @param {Function} [valid_err]
   * @return {Function}
   */
  utest.raise = function (fn, valid_err) {
    return function () {
      try {
        fn.apply(this, arguments);
      } catch (err) {
        return valid_err ? [ err, valid_err ] : true;
      }
      return false;
    };
  };

  /**
   * いくつかのメソッドをグローバルにする
   * @param {mixed} [global]
   */
  utest.define = function (global) {
    global = global || window;
    var methods = [ 'dump', 'multi', 'safe', 'raise' ];
    for (var i = 0, iz = methods.length; i < iz; ++i) {
      var method = methods[i];
      global[method] = utest[method];
    }
  };

  // -----------------------------------------------------------------------------

  return utest;

}(this, document, setTimeout, clearTimeout));
