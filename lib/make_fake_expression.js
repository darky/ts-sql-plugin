"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var typescript_1 = __importDefault(require("typescript")); // used as value, passed in by tsserver at runtime
// import tss from 'typescript/lib/tsserverlibrary'; // used as type only
var sql_1 = __importDefault(require("./sql"));
var utils_1 = require("./utils");
exports.make_fake_expression = function (type_checker, tags) {
    var _a;
    var fns = (_a = {},
        _a[tags.and] = sql_1.default.and,
        _a[tags.ins] = sql_1.default.ins,
        _a[tags.upd] = sql_1.default.upd,
        _a[tags.or] = sql_1.default.or,
        _a);
    var tag_regex = new RegExp('^' + tags.sql + '$|' + tags.raw + '$|' + tags.cond + '\\(');
    return fake_expression;
    function fake_expression_from_tagged_template(n) {
        var fn = sql_1.default.raw;
        if (n.template.kind === typescript_1.default.SyntaxKind.NoSubstitutionTemplateLiteral) {
            return [fn([n.template.text])];
        }
        if (n.template.kind === typescript_1.default.SyntaxKind.TemplateExpression) {
            var texts_1 = __spreadArrays([
                n.template.head.text
            ], n.template.templateSpans.map(function (span) { return span.literal.text; }));
            var values = n.template.templateSpans
                .map(function (span) { return fake_expression(span.expression); })
                .map(function (v) { return (utils_1.is_array(v) ? utils_1.deep_flatten(v) : [v]); });
            // * 要想编译期校验 sql, 则 sql 模板字符串内的所有有 sql.symbol 的对象都需要直接在模板字符串内定义(其实 and,ins,upd 可以不用, 只要给它们分配泛型类型就足够, 但是 raw 必须如此,
            // * 而且就算匹配类型, 也得寻找类型原始出处, 也容易出错, 所以干脆统一要求在模板字符串内定义)...
            // * 然后要做分支 raw, 则需要每个分支单独 explain 校验(不然肯定出错, 例如 asc desc 同时出现)...
            // * 做分支检测最好是出现分支时, 把 texts,values 复制一份, 分支各自进行下去, 进行到最终点的时候, 自行检测, 不需要统一检测所有分支
            // var arr = [[1],[21,22,23], [31,32], [4]];
            // // debugger;
            // var rs = arr.reduce((acc, cv) => {
            //   return cv.map(v => {
            //     return acc.map(ac => {
            //       return ac.concat(v);
            //     })
            //   }).reduce((acc, cv) => acc.concat(cv), []);
            // }, [[]]);
            // console.table(rs);
            // // rs should be [[1,21,31,4],[1,22,31,4],[1,23,31,4],[1,21,32,4],[1,22,32,4],[1,23,32,4]];
            var all_values = values.reduce(function (acc, cv) {
                return cv
                    .map(function (v) { return acc.map(function (ac) { return ac.concat(v); }); })
                    .reduce(function (acc, cv) { return acc.concat(cv); }, []);
            }, [[]]);
            return all_values.map(function (_values) { return sql_1.default.raw.apply(sql_1.default, __spreadArrays([texts_1], _values)); });
        }
    }
    // ! fake raw``,and(),ins(),upd(),?: and other expression. sql`` is just a special kind of raw``.
    function fake_expression(n) {
        var _a;
        if (typescript_1.default.isIdentifier(n)) {
            var typeNode = (_a = n.flowNode) === null || _a === void 0 ? void 0 : _a.node;
            if (typeNode && typeNode.kind === typescript_1.default.SyntaxKind.VariableDeclaration) {
                var childCount = typeNode.symbol.valueDeclaration.getChildCount();
                var template = typeNode.symbol.valueDeclaration.getChildAt(childCount - 1);
                if (typescript_1.default.isTaggedTemplateExpression(template) && tag_regex.test(template.tag.getText())) {
                    return fake_expression_from_tagged_template(template);
                }
            }
        }
        if (typescript_1.default.isCallExpression(n)) {
            var fn = fns[(n.expression.getLastToken() || n.expression).getText()];
            if (!!fn) {
                var t = type_checker.getTypeAtLocation(n.arguments[0]);
                var fake = null;
                if (fn == sql_1.default.and || fn == sql_1.default.upd || fn == sql_1.default.ins) {
                    var ut = t.getNumberIndexType();
                    if (fn == sql_1.default.ins && !!ut) {
                        if (!!ut.types) {
                            fake = ut.types.map(function (t) { return object_type_to_fake(t); });
                        }
                        else {
                            fake = object_type_to_fake(ut);
                        }
                    }
                    else {
                        fake = object_type_to_fake(t);
                    }
                }
                if (fn == sql_1.default.or) {
                    var ut = t.getNumberIndexType();
                    fake = ut.types.map(function (t) { return object_type_to_fake(t); });
                }
                return fn(fake);
            }
        }
        if (typescript_1.default.isTaggedTemplateExpression(n)) {
            // 因为又 sql.cond(boolean)`` 所以不能直接 n.tag.getText() === tags.xxx
            if (tag_regex.test(n.tag.getText())) {
                return fake_expression_from_tagged_template(n);
            }
        }
        if (typescript_1.default.isConditionalExpression(n)) {
            return [fake_expression(n.whenTrue), fake_expression(n.whenFalse)];
        }
        return null;
    }
};
// function isTypeReference(type: ts.Type): type is ts.TypeReference {
//   return !!(
//     type.getFlags() & ts.TypeFlags.Object &&
//     (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
//   );
// }
// function isArrayType(type: ts.Type): boolean {
//   return isTypeReference(type) && (
//     type.target.symbol.name === "Array" ||
//     type.target.symbol.name === "ReadonlyArray"
//   );
// }
var object_type_to_fake = function (t) {
    return t
        .getProperties()
        .reduce(function (acc, cv) {
        var _a;
        return Object.assign(acc, (_a = {}, _a[cv.getName()] = null, _a));
    }, {});
};
//# sourceMappingURL=make_fake_expression.js.map