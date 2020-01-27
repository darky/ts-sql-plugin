"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process = __importStar(require("child_process"));
// import ts from 'typescript'; // used as value, passed in by tsserver at runtime
var tsserverlibrary_1 = __importDefault(require("typescript/lib/tsserverlibrary")); // used as type only
var utils_1 = require("./utils");
var make_fake_expression_1 = require("./make_fake_expression");
function create(info) {
    var logger = function (msg) {
        return info.project.projectService.logger.info("[ts-sql-plugin] " + msg);
    };
    var config = __assign(__assign({ command: utils_1.default_command, cost_pattern: utils_1.default_cost_pattern.source }, info.config), { tags: __assign(__assign({}, utils_1.default_tags), (info.config || {}).tags) });
    var cost_pattern = new RegExp(config.cost_pattern);
    return new Proxy(info.languageService, {
        get: function (target, p, receiver) {
            if (p === 'getSemanticDiagnostics') {
                return function getSemanticDiagnostics(fileName) {
                    var origin_diagnostics = target.getSemanticDiagnostics(fileName);
                    var program = info.languageService.getProgram();
                    var fake_expression = make_fake_expression_1.make_fake_expression(program.getTypeChecker(), config.tags);
                    var source_file = program.getSourceFile(fileName);
                    var nodes = utils_1.find_all_nodes(source_file, function (n) {
                        return n.kind === tsserverlibrary_1.default.SyntaxKind.TaggedTemplateExpression &&
                            n.tag.getText() ===
                                config.tags.sql;
                    });
                    var explain_rss = nodes.map(function (n) {
                        var make_diagnostic = function (code, category, messageText) { return ({
                            file: source_file,
                            start: n.getStart(),
                            length: n.getEnd() - n.getStart(),
                            source: 'ts-sql-plugin',
                            code: code,
                            category: category,
                            messageText: messageText,
                        }); };
                        // one sql`select * from person ${xxx ? sql.raw`aaa` : sql.raw`bbb`}` may generate two sqls, need to be explained one by one
                        var query_configs = fake_expression(n);
                        for (var _i = 0, query_configs_1 = query_configs; _i < query_configs_1.length; _i++) {
                            var qc = query_configs_1[_i];
                            var s = qc.text.replace(/\?\?/gm, 'null');
                            var p_1 = child_process.spawnSync(config.command[0], config.command.slice(1).concat("EXPLAIN " + s));
                            if (p_1.status) {
                                var stderr_str = p_1.stderr.toString('utf8');
                                return make_diagnostic(1, tsserverlibrary_1.default.DiagnosticCategory.Error, stderr_str);
                            }
                            if ([config.error_cost, config.warn_cost, config.info_cost].some(function (it) { return it != void 0; }) &&
                                s.trimLeft().match(/^--\s*ts-sql-plugin:ignore-cost/) == null) {
                                var stdout_str = p_1.stdout.toString('utf8');
                                var match = stdout_str.match(cost_pattern);
                                if (match) {
                                    var _ = match[0], cost_str = match[1];
                                    var cost = Number(cost_str);
                                    if (cost > config.error_cost) {
                                        return make_diagnostic(1, tsserverlibrary_1.default.DiagnosticCategory.Error, "explain cost is too high: " + cost);
                                    }
                                    if (cost > config.warn_cost) {
                                        return make_diagnostic(1, tsserverlibrary_1.default.DiagnosticCategory.Warning, "explain cost is at warning: " + cost);
                                    }
                                    if (cost > config.info_cost) {
                                        return make_diagnostic(1, tsserverlibrary_1.default.DiagnosticCategory.Suggestion, "explain cost is ok: " + cost);
                                    }
                                }
                                else {
                                    return make_diagnostic(1, tsserverlibrary_1.default.DiagnosticCategory.Error, "can not extract cost with cost_pattern: " + cost_pattern.source + "\n" + stdout_str);
                                }
                            }
                        }
                    });
                    return __spreadArrays(origin_diagnostics, explain_rss.filter(function (v) { return !!v; }));
                };
            }
            return target[p];
        },
    });
}
exports.create = create;
//# sourceMappingURL=create.js.map