var ik = module.exports;(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Context = (function () {
    function Context(object, parent) {
        if (object === void 0) { object = {}; }
        this._object = object;
        this._parent = parent;
    }
    Context.prototype.pushContext = function (object) {
        if (object === void 0) { object = {}; }
        return new Context(object, this);
    };
    Context.prototype.popContext = function () {
        return this._parent;
    };
    Context.prototype.evaluate = function (object) {
        if (object == Context) {
            return this;
        }
        if (typeof object == 'object') {
            if (object instanceof Array) {
                if (object.length == 2 && typeof object[0] == 'function' && object[1] instanceof Array) {
                    var keys = object[1];
                    var vs_1 = [];
                    var fn = object[0];
                    for (var i = 0; i < keys.length; i++) {
                        var v = this.get(keys[i]);
                        vs_1.push(v);
                    }
                    return fn.apply(this, vs_1);
                }
                var vs = [];
                for (var _i = 0, object_1 = object; _i < object_1.length; _i++) {
                    var item = object_1[_i];
                    var v = this.evaluate(item);
                    vs.push(v);
                }
                return vs;
            }
            else {
                var a = {};
                for (var key in object) {
                    a[key] = this.evaluate(object[key]);
                }
                return a;
            }
        }
        return object;
    };
    Context.prototype.get = function (key) {
        var v = this._object[key];
        if (v === undefined) {
            if (this._parent) {
                v = this._parent.get(key);
            }
        }
        return v;
    };
    Context.prototype.set = function (key, value) {
        if (value === undefined) {
            delete this._object[key];
        }
        else {
            this._object[key] = value;
        }
    };
    Context.prototype.setGlobal = function (key, value) {
        if (this._parent) {
            this._parent.setGlobal(key, value);
        }
        else if (value === undefined) {
            delete this._object[key];
        }
        else {
            this._object[key] = value;
        }
    };
    Context.prototype.setWithKeys = function (keys, value) {
        if (keys.length == 0) {
            return;
        }
        if (value === undefined) {
            if (keys.length == 1) {
                var key_1 = keys[0];
                delete this._object[key_1];
                return;
            }
            var index = 0;
            var key = keys[index++];
            var object = this.get(key);
            while (index < keys.length - 1 && typeof object == 'object') {
                key = keys[index];
                object = object[key];
                index++;
            }
            if (index < keys.length && typeof object == 'object') {
                key = keys[index];
                delete object[key];
            }
        }
        else {
            if (keys.length == 1) {
                var key_2 = keys[0];
                this._object[key_2] = value;
                return;
            }
            var index = 0;
            var key = keys[index++];
            var object = this.get(key);
            if (typeof object != 'object') {
                object = this._object[key] = {};
            }
            while (index < keys.length - 1) {
                key = keys[index];
                var v = object[key];
                if (typeof v != 'object') {
                    v = object[key] = {};
                }
                object = v;
                index++;
            }
            if (index < keys.length && typeof object == 'object') {
                key = keys[index];
                object[key] = value;
            }
        }
    };
    return Context;
}());
exports.Context = Context;

},{}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Context_1 = require("./Context");
var Logic = (function () {
    function Logic(exec) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this._exec = exec;
        this._args = args;
    }
    Logic.prototype.then = function (onfulfilled, onrejected) {
        this._onfulfilled = onfulfilled;
        this._onrejected = onrejected;
        return this;
    };
    Logic.prototype.add = function (logic) {
        return this;
    };
    Logic.prototype.call = function (ctx) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (typeof this._exec == 'function') {
            return this._exec.apply(this, args);
        }
    };
    Logic.prototype.exec = function (ctx) {
        var _this = this;
        if (ctx === void 0) { ctx = new Context_1.Context(); }
        if (this._onfulfilled || this._onrejected) {
            return new Promise(function (resolve, reject) {
                var vs = ctx.evaluate(_this._args);
                try {
                    var r = _this.call.apply(_this, [ctx].concat(vs));
                    if (r instanceof Promise) {
                        r.then(function (v) {
                            if (_this._onfulfilled) {
                                var c = ctx.pushContext();
                                c.set('retValue', v);
                                resolve(_this._onfulfilled.exec(c));
                            }
                            else {
                                resolve(v);
                            }
                        }, function (reason) {
                            if (_this._onrejected) {
                                var c = ctx.pushContext();
                                c.set('reason', reason);
                                resolve(_this._onrejected.exec(c));
                            }
                            else {
                                reject(reason);
                            }
                        });
                    }
                    else {
                        if (_this._onfulfilled) {
                            var c = ctx.pushContext();
                            c.set('retValue', r);
                            resolve(_this._onfulfilled.exec(c));
                        }
                        else {
                            resolve(r);
                        }
                    }
                }
                catch (reason) {
                    if (_this._onrejected) {
                        var c = ctx.pushContext();
                        c.set('reason', reason);
                        resolve(_this._onrejected.exec(c));
                    }
                    else {
                        reject(reason);
                    }
                }
            });
        }
        var vs = ctx.evaluate(this._args);
        try {
            var r = this.call.apply(this, [ctx].concat(vs));
            if (r instanceof Promise) {
                return r;
            }
            return Promise.resolve(r);
        }
        catch (reason) {
            return Promise.reject(reason);
        }
    };
    return Logic;
}());
exports.Logic = Logic;
var Mixed = (function (_super) {
    __extends(Mixed, _super);
    function Mixed() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._logics = [];
        return _this;
    }
    Mixed.prototype.add = function (logic) {
        this._logics.push(logic);
        return this;
    };
    Mixed.prototype.call = function (ctx) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var vs = [];
        for (var _a = 0, _b = this._logics; _a < _b.length; _a++) {
            var v = _b[_a];
            vs.push(v.exec(ctx));
        }
        if (vs.length == 0) {
            return _super.prototype.call.apply(this, [ctx].concat(args));
        }
        var r = _super.prototype.call.apply(this, [ctx].concat(args));
        if (r instanceof Promise) {
            vs.push(r);
        }
        else {
            vs.push(Promise.resolve(r));
        }
        return new Promise(function (resolve, reject) {
            var n = vs.length;
            var i = 0;
            var errCount = 0;
            var reason;
            var done = function (r, e) {
                if (e) {
                    errCount++;
                    if (!reason) {
                        reason = e;
                    }
                }
                if (++i == n) {
                    if (errCount > 0) {
                        reject(reason);
                    }
                    else {
                        resolve();
                    }
                }
            };
            for (var _i = 0, vs_1 = vs; _i < vs_1.length; _i++) {
                var v = vs_1[_i];
                v.then(done, done);
            }
        });
    };
    return Mixed;
}(Logic));
exports.Mixed = Mixed;
var All = (function (_super) {
    __extends(All, _super);
    function All() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._logics = [];
        return _this;
    }
    All.prototype.add = function (logic) {
        this._logics.push(logic);
        return this;
    };
    All.prototype.call = function (ctx) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var vs = [];
        for (var _a = 0, _b = this._logics; _a < _b.length; _a++) {
            var v = _b[_a];
            vs.push(v.exec(ctx));
        }
        if (vs.length == 0) {
            return _super.prototype.call.apply(this, [ctx].concat(args));
        }
        var r = _super.prototype.call.apply(this, [ctx].concat(args));
        if (r instanceof Promise) {
            vs.push(r);
        }
        else {
            vs.push(Promise.resolve(r));
        }
        return Promise.all(vs);
    };
    return All;
}(Logic));
exports.All = All;
var Race = (function (_super) {
    __extends(Race, _super);
    function Race() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._logics = [];
        return _this;
    }
    Race.prototype.add = function (logic) {
        this._logics.push(logic);
        return this;
    };
    Race.prototype.call = function (ctx) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var vs = [];
        for (var _a = 0, _b = this._logics; _a < _b.length; _a++) {
            var v = _b[_a];
            vs.push(v.exec(ctx));
        }
        if (vs.length == 0) {
            return _super.prototype.call.apply(this, [ctx].concat(args));
        }
        var r = _super.prototype.call.apply(this, [ctx].concat(args));
        if (r instanceof Promise) {
            vs.push(r);
        }
        else {
            vs.push(Promise.resolve(r));
        }
        return Promise.all(vs);
    };
    return Race;
}(Logic));
exports.Race = Race;
var Set = (function (_super) {
    __extends(Set, _super);
    function Set(options) {
        return _super.call(this, function (ctx, options) {
            for (var key in options) {
                var keys = key.split('.');
                ctx.setWithKeys(keys, options[key]);
            }
        }, Context_1.Context, options) || this;
    }
    return Set;
}(Logic));
exports.Set = Set;
var App = (function (_super) {
    __extends(App, _super);
    function App() {
        return _super.call(this, function () { }) || this;
    }
    App.prototype.exec = function (input) {
        var _this = this;
        if (input instanceof Context_1.Context) {
            return _super.prototype.exec.call(this, input);
        }
        var ctx = new Context_1.Context();
        ctx.set('input', input);
        ctx.set('output', {});
        ctx.set('self', {});
        return new Promise(function (resolve, reject) {
            _super.prototype.exec.call(_this, ctx).then(function () {
                resolve(ctx.get('output'));
            }, reject);
        });
    };
    return App;
}(Mixed));
exports.App = App;

},{"./Context":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Logic_1 = require("./Logic");
function app() {
    return new Logic_1.App();
}
exports.app = app;
function set(object) {
    return new Logic_1.Set(object);
}
exports.set = set;
function race(object) {
    return new Logic_1.Race(object);
}
exports.race = race;
function mixed(object) {
    return new Logic_1.Mixed(object);
}
exports.mixed = mixed;
function all(object) {
    return new Logic_1.All(object);
}
exports.all = all;
function logic(exec) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return new (Logic_1.Logic.bind.apply(Logic_1.Logic, [void 0, exec].concat(args)))();
}
exports.logic = logic;
function If(v) {
    return new Logic_1.Logic(function (v) {
        if (v) {
            return Promise.resolve(v);
        }
        return Promise.reject('If');
    }, v);
}
exports.If = If;
function Throw(errmsg) {
    return new Logic_1.Logic(function (errmsg) {
        return Promise.reject(errmsg);
    }, errmsg);
}
exports.Throw = Throw;
function exec(object, name, input) {
    var v = object[name];
    if (v instanceof Promise) {
        return v;
    }
    if (v instanceof Logic_1.Logic) {
        return v.exec(input);
    }
    return Promise.reject('未找到 ' + name);
}
exports.exec = exec;

},{"./Logic":2}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Logic_1 = require("../core/Logic");
var Event = (function (_super) {
    __extends(Event, _super);
    function Event(name) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return _super.apply(this, [function (name) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var pages = getCurrentPages();
                for (var _a = 0, pages_1 = pages; _a < pages_1.length; _a++) {
                    var page = pages_1[_a];
                    var fn = page[name + ''];
                    if (typeof fn == 'function') {
                        fn.apply(page, args);
                    }
                }
            }, name].concat(args)) || this;
    }
    return Event;
}(Logic_1.Logic));
exports.Event = Event;
function event(name) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return new (Event.bind.apply(Event, [void 0, name].concat(args)))();
}
exports.event = event;

},{"../core/Logic":2}],5:[function(require,module,exports){
function copy(dst, src) {
    for (var key in src) {
        dst[key] = src[key];
    }
}

copy(ik || module.exports, require('../core/Context'));
copy(ik || module.exports, require('../core/Logic'));
copy(ik || module.exports, require('../core/ik'));
copy(ik || module.exports, require('./http'));
copy(ik || module.exports, require('./page'));
copy(ik || module.exports, require('./store'));
copy(ik || module.exports, require('./login'));
copy(ik || module.exports, require('./event'));
},{"../core/Context":1,"../core/Logic":2,"../core/ik":3,"./event":4,"./http":6,"./login":7,"./page":8,"./store":9}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Logic_1 = require("../core/Logic");
var Context_1 = require("../core/Context");
var Http = (function (_super) {
    __extends(Http, _super);
    function Http(options) {
        return _super.call(this, function (ctx, options) {
            return new Promise(function (resolve, reject) {
                wx.request({
                    method: options.method || "GET",
                    url: options.url,
                    data: options.data,
                    header: options.header,
                    success: function (res) {
                        var v = ctx.pushContext();
                        v.set('retValue', res.data);
                        resolve(v);
                    },
                    fail: function (e) {
                        reject(e.errMsg || '请检查网络设置');
                    }
                });
            });
        }, Context_1.Context, options) || this;
    }
    return Http;
}(Logic_1.Logic));
exports.Http = Http;
function http(options) {
    return new Http(options);
}
exports.http = http;

},{"../core/Context":1,"../core/Logic":2}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Logic_1 = require("../core/Logic");
var Context_1 = require("../core/Context");
var Login = (function (_super) {
    __extends(Login, _super);
    function Login() {
        return _super.call(this, function (ctx) {
            return new Promise(function (resolve, reject) {
                wx.login({
                    success: function (res) {
                        var c = ctx.pushContext();
                        c.set("retValue", res.code);
                        resolve(res.code);
                    },
                    fail: function (res) {
                        reject(res.errMsg);
                    }
                });
            });
        }, Context_1.Context) || this;
    }
    return Login;
}(Logic_1.Logic));
exports.Login = Login;
var GetUserInfo = (function (_super) {
    __extends(GetUserInfo, _super);
    function GetUserInfo() {
        return _super.call(this, function (ctx) {
            return new Promise(function (resolve, reject) {
                wx.getUserInfo({
                    success: function (res) {
                        var c = ctx.pushContext();
                        c.set("retValue", res);
                        resolve(res);
                    },
                    fail: function (res) {
                        reject(res.errMsg);
                    }
                });
            });
        }, Context_1.Context) || this;
    }
    return GetUserInfo;
}(Logic_1.Logic));
exports.GetUserInfo = GetUserInfo;
function login() {
    return new Login();
}
exports.login = login;
function getUserInfo() {
    return new GetUserInfo();
}
exports.getUserInfo = getUserInfo;

},{"../core/Context":1,"../core/Logic":2}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Logic_1 = require("../core/Logic");
var Context_1 = require("../core/Context");
var OpenType;
(function (OpenType) {
    OpenType["navigateTo"] = "navigateTo";
    OpenType["redirectTo"] = "redirectTo";
})(OpenType = exports.OpenType || (exports.OpenType = {}));
var _openURL;
var Open = (function (_super) {
    __extends(Open, _super);
    function Open(url, openType) {
        if (openType === void 0) { openType = OpenType.navigateTo; }
        return _super.call(this, function (url, openType) {
            var u = _openURL ? _openURL(url + '') : url + '';
            if (openType == OpenType.redirectTo) {
                wx.redirectTo({
                    url: u
                });
            }
            else {
                wx.navigateTo({
                    url: u
                });
            }
        }, url, openType) || this;
    }
    return Open;
}(Logic_1.Logic));
exports.Open = Open;
var Close = (function (_super) {
    __extends(Close, _super);
    function Close(delta) {
        if (delta === void 0) { delta = 1; }
        return _super.call(this, function (delta) {
            wx.navigateBack({
                delta: delta
            });
        }, delta) || this;
    }
    return Close;
}(Logic_1.Logic));
exports.Close = Close;
var _env;
var Env = (function (_super) {
    __extends(Env, _super);
    function Env() {
        return _super.call(this, function (ctx) {
            if (_env === undefined) {
                return new Promise(function (resolve, reject) {
                    wx.getSystemInfo({
                        success: function (res) {
                            _env = res;
                            ctx.setGlobal('env', _env);
                            resolve();
                        },
                        fail: function (res) {
                            reject(res.errMsg);
                        }
                    });
                });
            }
            else {
                ctx.setGlobal('env', _env);
            }
        }, Context_1.Context) || this;
    }
    return Env;
}(Logic_1.Logic));
exports.Env = Env;
function setOpenURL(fn) {
    _openURL = fn;
}
exports.setOpenURL = setOpenURL;
function open(url, openType) {
    if (openType === void 0) { openType = OpenType.navigateTo; }
    return new Open(url, openType);
}
exports.open = open;
function close(delta) {
    if (delta === void 0) { delta = 1; }
    return new Close(delta);
}
exports.close = close;
function env() {
    return new Env();
}
exports.env = env;

},{"../core/Context":1,"../core/Logic":2}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Logic_1 = require("../core/Logic");
var Context_1 = require("../core/Context");
var GetStore = (function (_super) {
    __extends(GetStore, _super);
    function GetStore(options) {
        return _super.call(this, function (ctx, options) {
            return new Promise(function (resolve) {
                var vs = [];
                for (var key in options) {
                    var keys = key.split('.');
                    var sKey = options[key];
                    (function (keys, sKey) {
                        vs.push(new Promise(function (resolve) {
                            wx.getStorage({
                                key: sKey,
                                success: function (res) {
                                    ctx.setWithKeys(keys, res.data);
                                    resolve();
                                },
                                fail: function () {
                                    resolve();
                                }
                            });
                        }));
                    })(keys, sKey);
                }
                if (vs.length == 0) {
                    resolve();
                }
                else if (vs.length == 1) {
                    vs[0].then(function () {
                        resolve();
                    });
                }
                else {
                    Promise.all(vs).then(function () {
                        resolve();
                    });
                }
            });
        }, Context_1.Context, options) || this;
    }
    return GetStore;
}(Logic_1.Logic));
exports.GetStore = GetStore;
var SetStore = (function (_super) {
    __extends(SetStore, _super);
    function SetStore(options) {
        return _super.call(this, function (options) {
            return new Promise(function (resolve) {
                var vs = [];
                for (var key in options) {
                    var v = options[key];
                    (function (key, v) {
                        vs.push(new Promise(function (resolve) {
                            wx.setStorage({
                                key: key,
                                data: v,
                                complete: function () {
                                    resolve();
                                }
                            });
                        }));
                    })(key, v);
                }
                if (vs.length == 0) {
                    resolve();
                }
                else if (vs.length == 1) {
                    vs[0].then(function () {
                        resolve();
                    });
                }
                else {
                    Promise.all(vs).then(function () {
                        resolve();
                    });
                }
            });
        }, options) || this;
    }
    return SetStore;
}(Logic_1.Logic));
exports.SetStore = SetStore;
function getStore(options) {
    return new GetStore(options);
}
exports.getStore = getStore;
function setStore(options) {
    return new SetStore(options);
}
exports.setStore = setStore;

},{"../core/Context":1,"../core/Logic":2}]},{},[5]);
