"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var raw = function (texts) {
    var _a;
    var vs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        vs[_i - 1] = arguments[_i];
    }
    var text = texts[0];
    var values = [];
    vs.forEach(function (v, idx) {
        if (!!v && v[symbol]) {
            text += v.text.replace(/\$\d+/g, '??');
            values = __spreadArrays(values, v.values);
        }
        else {
            text += '??';
            values.push(v);
        }
        text += texts[idx + 1] || '';
    });
    return _a = {}, _a[symbol] = true, _a.text = text, _a.values = values, _a;
};
exports.sql = function (texts) {
    var vs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        vs[_i - 1] = arguments[_i];
    }
    var query = raw.apply(void 0, __spreadArrays([texts], vs));
    query.text = query.text.split('??').reduce(function (acc, cv, ci) { return acc + '$' + ci + cv; });
    return query;
};
exports.default = exports.sql;
var symbol = (exports.sql.symbol = Symbol('sql'));
exports.sql.raw = raw;
exports.sql.cond = function (condition) { return condition ? raw : function () {
    var anything = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        anything[_i] = arguments[_i];
    }
    return raw(templateObject_1 || (templateObject_1 = __makeTemplateObject([""], [""])));
}; };
// const to_and = {m: undefined, n: undefined};
// no first and
// sql`select * from a where ${sql.and(to_and)}`
// with first and
// sql`select * from a where (1=1 ${sql.and(to_and)}) or (${sql.and(another_to_and)})`
// sql`select * from a where 1=1 and ${sql.and(to_and)}`
// 东西加多了是硬伤, 加少了可以有 sql.raw, 所以尽量少加
exports.sql.and = function (obj) {
    var _a, _b;
    var kvs = Object.entries(obj)
        .filter(function (_a) {
        var k = _a[0], v = _a[1];
        return v !== undefined;
    })
        .sort(function (_a, _b) {
        var ka = _a[0], va = _a[1];
        var kb = _b[0], vb = _b[1];
        return (ka < kb ? -1 : ka > kb ? 1 : 0);
    });
    var values = [];
    if (kvs.length === 0) {
        return _a = {}, _a[symbol] = true, _a.text = '', _a.values = values, _a;
    }
    var text = kvs
        .map(function (_a) {
        var k = _a[0], v = _a[1];
        values.push(v);
        return escape_identifier(k) + ' ??';
    })
        .join(' AND ');
    return _b = {}, _b[symbol] = true, _b.text = text, _b.values = values, _b;
};
exports.sql.or = function (objs) {
    var _a;
    return objs.map(function (obj) { return exports.sql.and(obj); }).reduce(function (acc, cv, idx) {
        acc.text += (idx === 0 ? '' : ' OR') + " (" + cv.text + ")";
        acc.values = acc.values.concat(cv.values);
        return acc;
    }, (_a = {}, _a[symbol] = true, _a.text = '', _a.values = [], _a));
};
exports.sql.ins = function (obj_or_objs) {
    var _a;
    var objs = [].concat(obj_or_objs);
    var keys = Object.keys(Object.assign.apply(Object, __spreadArrays([{}], objs))).sort();
    var values = [];
    var text = "(" + keys.map(function (k) { return escape_identifier(k).split(' ')[0]; }).join(', ') + ") VALUES " + objs
        .map(function (obj) {
        return "(" + keys
            .map(function (k) {
            values.push(obj[k]);
            return '??';
        })
            .join(', ') + ")";
    })
        .join(', ');
    return _a = {}, _a[symbol] = true, _a.text = text, _a.values = values, _a;
};
exports.sql.upd = function (obj) {
    var _a;
    var kvs = Object.entries(obj)
        .filter(function (_a) {
        var k = _a[0], v = _a[1];
        return v !== undefined;
    })
        .sort(function (_a, _b) {
        var ka = _a[0], va = _a[1];
        var kb = _b[0], vb = _b[1];
        return (ka < kb ? -1 : ka > kb ? 1 : 0);
    });
    var values = [];
    var text = kvs
        .map(function (_a) {
        var k = _a[0], v = _a[1];
        values.push(v);
        return escape_identifier(k) + ' ??';
    })
        .join(', ');
    return _a = {}, _a[symbol] = true, _a.text = text, _a.values = values, _a;
};
function escape_identifier(identifier) {
    var _a, _b, _c;
    var _d = ['', '', '', ''], schema = _d[0], table = _d[1], column = _d[2], operator = _d[3];
    _a = identifier.replace(/"/g, '').split(' '), _b = _a[0], column = _b === void 0 ? '' : _b, _c = _a[1], operator = _c === void 0 ? '=' : _c;
    var idents = column.split('.');
    if (idents.length === 1) {
        column = idents[0];
    }
    if (idents.length === 2) {
        table = idents[0], column = idents[1];
    }
    if (idents.length === 3) {
        schema = idents[0], table = idents[1], column = idents[2];
    }
    return ("\"" + schema + "\".\"" + table + "\".\"" + column + "\" " + operator).replace(/""\./g, '');
}
var templateObject_1;
// ? 有想过把所有数据都放在类型系统上, 这样 sql.raw`` 得到的结果就可以作为变量到处传递了, 不需要限制死在 sql`` 内部使用, 与运行时等同...但问题是 TemplateStringsArray 把字符串模板的 const 字符串信息丢失了, 这里只能 typescript 上游去解决, 这样在类型上根本无法得到 raw 里面的字符串, 至于从变量传递作用域上, 那结果就是完全不确定的
// interface AAA<TSA, VS> {
//   __texts: TSA;
//   __values: VS;
// }
// function abc<TSA extends TemplateStringsArray, VS extends any[]>(texts: TSA, ...vs: VS): AAA<TSA, VS> {
//   return {__texts: texts, __values: vs}
// }
// var a = abc`select * from ${123} and good ${new Date()} ${window}`;
// // var a: AAA<['select * from ', ' and good ', ' ', ''], [number, Date, Window]>
// enum ExpressionKind {
//   RAW,
//   SQL,
//   AND,
//   INS,
//   UPD,
// };
// interface Expression {
//   __kind__: ExpressionKind;
//   text: string;
//   values: any[];
// }
// interface RawExpression extends Expression {
//   __kind__: ExpressionKind.RAW;
// }
// interface SqlExpression extends Expression {
//   __kind__: ExpressionKind.SQL;
// }
// interface AndExpression extends Expression {
//   __kind__: ExpressionKind.AND;
// }
// interface InsExpression extends Expression {
//   __kind__: ExpressionKind.INS;
// }
// interface UpdExpression extends Expression {
//   __kind__: ExpressionKind.UPD;
// }
// // raw: raw
// // and: and<T>
// // ins: ins<T>
// // upd: upd<T>
//# sourceMappingURL=sql.js.map