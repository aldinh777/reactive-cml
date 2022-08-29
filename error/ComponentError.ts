export default class ComponentError extends Error {
    static invalidState(param: string, prop: string, comp: string): ComponentError {
        return new ComponentError(
            `'${param}' are not a valid State in 'state:${prop}' property of '${comp}' component`
        );
    }
    static invalidCollect(param: string, prop: string, comp: string): ComponentError {
        return new ComponentError(
            `'${param}' are not a valid StateCollection in 'collect:${prop}' property of '${comp}' component`
        );
    }
    static componentCrash(comp: string, err: any): ComponentError {
        return new ComponentError(
            `Crash at component '${comp}'. reason:\n    ${err ? err.stack : err}`
        );
    }
}
