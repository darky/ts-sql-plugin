import ts from 'typescript';
export interface Tags {
    sql: string;
    and: string;
    or: string;
    ins: string;
    upd: string;
    raw: string;
    cond: string;
}
export declare const make_fake_expression: (program: ts.Program, tags: Tags) => (n: ts.Expression) => any;
