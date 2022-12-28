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
}
