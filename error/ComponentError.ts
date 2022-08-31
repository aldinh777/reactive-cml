export default class ComponentError extends Error {
    reason: string;
    compTrace: string[];

    constructor(msg: string, trace: string[], reason?: string) {
        super(msg);
        this.name = 'ComponentError';
        this.compTrace = trace;
        this.reason = reason === undefined ? msg : reason;
        this.message = msg + `\ntrace  : ${trace.join(' > ')}` + `\nreason :\n    ${this.reason}`;
    }
    static invalidState(comp: string, elem: string, prop: string, param: string): ComponentError {
        return new ComponentError(
            `'${param}' are not a valid State in 'state:${prop}' property of '${elem}}' element`,
            [comp]
        );
    }
    static invalidCollect(comp: string, elem: string, prop: string, param: string): ComponentError {
        return new ComponentError(
            `'${param}' are not a valid StateCollection in 'collect:${prop}' property of '${elem}' component`,
            [comp]
        );
    }
    static componentCrash(comp: string, err: any): ComponentError {
        let reason;
        let trace = [comp];
        if (err instanceof Error) {
            if (err.name === 'ComponentError') {
                trace = trace.concat((err as ComponentError).compTrace);
                reason = (err as ComponentError).reason;
            } else {
                reason = err.stack;
            }
        } else {
            reason = err || '?';
        }
        return new ComponentError(`Crash at component '${comp}'.\n`, trace, reason);
    }
}
