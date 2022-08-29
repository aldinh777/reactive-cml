import { ComponentChildren, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';
import { PropAlias, propAlias, readAlias } from '../prop-util';

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.list !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    const list = params[props.list];
    const alias: string = props.as;
    const destruct: PropAlias[] =
        typeof props.destruct === 'string' ? readAlias(props.destruct) : [];
    const result: NodeComponent[] = [];
    for (const item of list) {
        const localParams = propAlias(params, destruct, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        result.push(...intoDom(tree, localParams, _super));
    }
    return result;
}
