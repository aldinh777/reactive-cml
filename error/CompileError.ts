export default class CompileError extends Error {
    static statementRequire(statement: string, prop: string): CompileError {
        return new CompileError(
            `${statement} statement must have property '${prop}' and cannot be empty`
        );
    }
    static emptyBindedProperty(type: string, prop: string, comp: string) {
        return new CompileError(`${type} '${prop}' have no binded value at component '${comp}'`);
    }
}
