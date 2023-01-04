import { Context, NodeComponent, intoDom } from '..';
import { PropAlias, readAlias, propAlias } from '../prop-util';
import { Properties } from '../../util';

export default function (props: Properties = {}, component: Context = {}): NodeComponent[] | void {
    if (typeof props.obj !== 'string' || typeof props.extract !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const obj = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.extract);
    const localparams = propAlias(params, propnames, obj);
    return intoDom(children, localparams, _super);
}
