export default class CompileError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = 'CompileError';
    }
    static statementRequire(statement: string, prop: string): CompileError {
        return new CompileError(
            `'${statement}' statement must have property '${prop}' and cannot be empty`
        );
    }
    static emptyBindedProperty(comp: string, type: string, prop: string): CompileError {
        return new CompileError(`component '${comp}' has no binded value at ${type} '${prop}'`);
    }
    static invalidIdentifier(
        comp: string,
        type: string,
        prop: string,
        value: string
    ): CompileError {
        return new CompileError(
            `component '${comp}' has invalid indentifier at ${type} '${prop}' : '${value}'`
        );
    }
    static invalidProperty(comp: string, prop: string, value: string): CompileError {
        return CompileError.invalidIdentifier(comp, 'property', prop, value);
    }
    static invalidComponent(comp: string): CompileError {
        return new CompileError(`invalid component name : '${comp}'`);
    }
    static unresolvedDependency(dep: string, file: string): CompileError {
        return new CompileError(`unresolved dependency '${dep}' at '${file}'`);
    }
}
