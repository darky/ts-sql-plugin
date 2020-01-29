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
var typescript_1 = __importDefault(require("typescript"));
exports.is_array = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};
exports.deep_flatten = function (arr) {
    var new_arr = [];
    new_arr = arr.reduce(function (acc, cv) { return acc.concat(cv); }, []);
    while (new_arr.length !== arr.length) {
        arr = new_arr;
        new_arr = arr.reduce(function (acc, cv) { return acc.concat(cv); }, []);
    }
    return new_arr;
};
exports.find_all_nodes = function (sourceFile, cond) {
    var result = [];
    function find(node) {
        if (cond(node)) {
            result.push(node);
            return;
        }
        else {
            typescript_1.default.forEachChild(node, find);
        }
    }
    find(sourceFile);
    return result;
};
exports.default_command = ['psql', '-c'];
exports.default_tags = {
    sql: 'sql',
    and: 'and',
    or: 'or',
    ins: 'ins',
    upd: 'upd',
    raw: 'raw',
    cond: 'cond',
};
exports.default_cost_pattern = /\(cost=\d+\.?\d*\.\.(\d+\.?\d*)/;
exports.get_all_ts_files = function (dirpath) {
    var ts_files = [];
    var paths = fs.readdirSync(dirpath).map(function (it) { return path.join(dirpath, it); });
    var path_stats = paths.map(function (it) { return [it, fs.statSync(it)]; });
    var exts = ['.ts', '.tsx'];
    var ts_folders = path_stats.filter(function (_a) {
        var p = _a[0], s = _a[1];
        return (s.isDirectory() && path.basename(p) !== 'node_modules') ||
            (s.isFile() && exts.indexOf(path.extname(p)) > -1);
    });
    ts_folders.forEach(function (_a) {
        var p = _a[0], s = _a[1];
        if (s.isFile()) {
            ts_files.push(p);
        }
    });
    ts_folders.forEach(function (_a) {
        var p = _a[0], s = _a[1];
        if (s.isDirectory()) {
            ts_files = ts_files.concat(exports.get_all_ts_files(p));
        }
    });
    return ts_files;
};
function report(sourceFile, node, message, level) {
    if (level === void 0) { level = 3; }
    var _a = sourceFile.getLineAndCharacterOfPosition(node.getStart()), line = _a.line, character = _a.character;
    console[['info', 'warn', 'error'][level - 1]](sourceFile.fileName + " (" + (line + 1) + "," + (character + 1) + "): " + message + "\n\n");
}
exports.report = report;
function index_of_array(parent, child) {
    I: for (var i = 0; i < parent.length; i++) {
        J: for (var j = 0; j < child.length; j++) {
            if (parent[i + j] !== child[j]) {
                continue I;
            }
        }
        return i;
    }
    return -1;
}
exports.index_of_array = index_of_array;
//# sourceMappingURL=utils.js.map