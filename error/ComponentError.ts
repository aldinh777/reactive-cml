import { DEFAULT_COMPONENT_SET } from '../parser/constants';

export default class ComponentError extends Error {
    reason: string;
    componentTraces: string[];

    constructor(msg: string, trace: string[] = [], reason?: string) {
        super(msg);
        this.name = 'ComponentError';
        this.componentTraces = trace;
        this.reason = reason === undefined ? msg : reason;
        this.message = msg + `\ntrace  : ${trace.join(' > ')}` + `\nreason :\n    ${this.reason}`;
    }
    static invalidState(elem: string, prop: string, param: string): ComponentError {
        return new ComponentError(
            `'${param}' are not a valid State in 'state:${prop}' property of '${elem}' element`
        );
    }
    static invalidCollect(elem: string, prop: string, param: string): ComponentError {
        return new ComponentError(
            `'${param}' are not a valid StateCollection in 'collect:${prop}' property of '${elem}' element`
        );
    }
    static componentCrash(name: string, err: any): ComponentError {
        let reason: string;
        let trace = DEFAULT_COMPONENT_SET.has(name) ? [] : [name];
        if (err instanceof Error) {
            if (err.name === 'ComponentError') {
                trace = trace.concat((err as ComponentError).componentTraces);
                reason = (err as ComponentError).reason;
            } else {
                reason = err.stack;
            }
        } else {
            reason = err || '?';
        }
        return new ComponentError(`Crash at component '${name}'.`, trace, reason);
    }
}
