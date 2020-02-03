export declare const sql: {
    (texts: TemplateStringsArray, ...vs: any[]): {
        [x: string]: string | boolean | any[];
        text: string;
        values: any[];
    };
    symbol: symbol;
    raw: (texts: TemplateStringsArray, ...vs: any[]) => {
        [x: string]: string | boolean | any[];
        text: string;
        values: any[];
    };
    cond(condition: boolean): (texts: TemplateStringsArray, ...vs: any[]) => {
        [x: string]: string | boolean | any[];
        text: string;
        values: any[];
    };
    and(obj: object): {
        [x: string]: string | boolean | any[];
        text: string;
        values: any[];
    };
    or<T extends any[]>(objs: T): {
        [x: string]: string | boolean | any[];
        text: string;
        values: any[];
    };
    ins(obj_or_objs: object | object[]): {
        [x: string]: string | boolean | any[];
        text: string;
        values: any[];
    };
    upd(obj: object): {
        [x: string]: string | boolean | any[];
        text: string;
        values: any[];
    };
    mock(obj: {
        mock: string;
        placeholder: string;
    }): {
        [x: string]: string | boolean | any[];
        text: string;
        values: any[];
    };
};
export default sql;
