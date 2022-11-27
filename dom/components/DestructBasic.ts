import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';
import { PropAlias, readAlias, propAlias } from '../prop-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.obj !== 'string' || typeof props.extract !== 'string') {
        return;
    }
    const { slots, params, _super } = context;
    const obj = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.extract);
    const localparams = propAlias(params, propnames, obj);
    return intoDom(slots._children.elems, localparams, _super);
}
