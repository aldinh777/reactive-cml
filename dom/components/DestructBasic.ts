import { ComponentChildren, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';
import { propAlias, PropAlias, readAlias } from '../prop-util';

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.obj !== 'string' || typeof props.as !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    const obj = params[props.obj];
    const propnames: PropAlias[] = readAlias(props.as);
    const localparams = propAlias(params, propnames, obj);
    return intoDom(tree, localparams, _super);
}
