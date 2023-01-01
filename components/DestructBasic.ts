import { Context, NodeComponent, intoDom } from '../dom';
import { PropAlias, readAlias, propAlias } from '../dom/prop-util';
import { Properties } from '../util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.obj !== 'string' || typeof props.extract !== 'string') {
        return;
    }
    const { children, params, _super } = context;
    const obj = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.extract);
    const localparams = propAlias(params, propnames, obj);
    return intoDom(children, localparams, _super);
}
