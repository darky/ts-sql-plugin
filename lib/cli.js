#!/usr/bin/env node
"use strict";
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
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var child_process = __importStar(require("child_process"));
var typescript_1 = __importDefault(require("typescript"));
var commander_1 = __importDefault(require("commander"));
var utils_1 = require("./utils");
var make_fake_expression_1 = require("./make_fake_expression");
var default_cost_pattern_source = utils_1.default_cost_pattern.source;
var default_tags_string = Object.entries(utils_1.default_tags)
    .map(function (it) { return it.join('='); })
    .join(',');
commander_1.default
    .option('-p, --project <string>', 'The project path or tsconfig.json, defaults to: ./ .', './')
    .option('-e, --exclude <regexp>', 'The regexp to exclude files, defaults to: node_modules .', 'node_modules')
    .option('-t, --tags <string>', "The tags you used in you ts file, defaults to: " + default_tags_string + " .", default_tags_string)
    .option('-m, --error-cost <int>', 'Throw error if explain cost exceeds treshold.')
    .option('--warn-cost <int>', 'Log warning if explain cost exceeds treshold.')
    .option('--info-cost <int>', 'Log info if explain cost exceeds treshold.')
    .option('--cost-pattern <regexp>', "The regexp used to extract cost from command stdout, defaults to: " + default_cost_pattern_source + " .", default_cost_pattern_source)
    .arguments('[command...]')
    .description('Explain all your sqls in your code to test them. Eg: ts-sql-plugin -p ./my_ts_projet psql -c', {
    command: 'The command to be run to explain the faked sql, like: psql.',
    args: 'The arguments passed to the command, like: -c. The faked sql will be added as the last argument.',
})
    .action(function (_command) {
    if (_command.length === 0) {
        _command = utils_1.default_command;
    }
    else {
        _command = commander_1.default.rawArgs.slice(utils_1.index_of_array(commander_1.default.rawArgs, _command));
    }
    var config = commander_1.default.opts();
    config.error_cost = config.errorCost;
    config.warn_cost = config.warnCost;
    config.info_cost = config.infoCost;
    config.cost_pattern = config.costPattern;
    var exclude = new RegExp(config.exclude);
    var tags = Object.assign({}, utils_1.default_tags, config.tags
        .split(',')
        .map(function (s) { return s.split('='); })
        .reduce(function (acc, _a) {
        var k = _a[0], v = _a[1];
        acc[k] = v;
        return acc;
    }, {}));
    var cost_pattern = new RegExp(config.cost_pattern);
    var project_path = path.dirname(config.project);
    var tsconfig_path = path.join(project_path, 'tsconfig.json');
    var tsconfig = typescript_1.default.parseConfigFileTextToJson(tsconfig_path, fs.readFileSync(tsconfig_path, { encoding: 'utf8' })).config;
    var program = typescript_1.default.createProgram(utils_1.get_all_ts_files(project_path), tsconfig);
    var fake_expression = make_fake_expression_1.make_fake_expression(program.getTypeChecker(), tags);
    var has_error = false;
    program.getSourceFiles().forEach(function (f) {
        if (!exclude.test(f.fileName)) {
            delint(f);
        }
    });
    if (has_error) {
        console.error('Your code can not pass all sql test!!!');
        process.exit(1);
    }
    function delint(sourceFile) {
        delintNode(sourceFile);
        function delintNode(node) {
            if (node.kind === typescript_1.default.SyntaxKind.TaggedTemplateExpression) {
                var n = node;
                if (n.tag.getText() === tags.sql) {
                    var query_configs = fake_expression(n);
                    for (var _i = 0, query_configs_1 = query_configs; _i < query_configs_1.length; _i++) {
                        var qc = query_configs_1[_i];
                        var s = qc.text.replace(/\?\?/gm, 'null');
                        var p = child_process.spawnSync(_command[0], _command.slice(1).concat("EXPLAIN " + s));
                        if (p.status) {
                            var stderr_str = p.stderr.toString('utf8');
                            has_error = true;
                            utils_1.report(sourceFile, node, stderr_str);
                            break;
                        }
                        if ((config.error_cost || config.warn_cost || config.info_cost) &&
                            s.trimLeft().match(/^--\s*ts-sql-plugin:ignore-cost/) == null) {
                            var stdout_str = p.stdout.toString('utf8');
                            var match = stdout_str.match(cost_pattern);
                            if (match) {
                                var _ = match[0], cost_str = match[1];
                                var cost = Number(cost_str);
                                if (cost > config.error_cost) {
                                    has_error = true;
                                    utils_1.report(sourceFile, node, "Error: explain cost is too high: " + cost + "\n" + s, 3);
                                    break;
                                }
                                else if (cost > config.warn_cost) {
                                    utils_1.report(sourceFile, node, "Warn: explain cost is at warning: " + cost + "\n" + s, 2);
                                }
                                else if (cost > config.info_cost) {
                                    utils_1.report(sourceFile, node, "Info: explain cost is ok: " + cost + "\n" + s, 1);
                                }
                            }
                        }
                    }
                    // query_configs.map((qc: any) => {
                    //   let s = qc.text.replace(/\?\?/gm, 'null');
                    //   let p = child_process.spawnSync(
                    //     _command,
                    //     _args.concat(`EXPLAIN ${s}`),
                    //   );
                    //   if (p.status) {
                    //     has_error = true;
                    //     report(sourceFile, node, stdout_str);
                    //   }
                    // });
                }
            }
            typescript_1.default.forEachChild(node, delintNode);
        }
    }
});
commander_1.default.parse(process.argv);
//# sourceMappingURL=cli.js.map