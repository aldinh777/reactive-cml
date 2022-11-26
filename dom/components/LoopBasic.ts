import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';
import { PropAlias, readAlias, propAlias } from '../prop-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.list !== 'string') {
        return;
    }
    const { tree, params, _super } = context;
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
