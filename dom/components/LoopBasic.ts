import { Context, NodeComponent, intoDom } from '..';
import { PropAlias, readAlias, propAlias } from '../prop-util';
import { Properties } from '../../util-type';

export default function (props: Properties = {}, component: Context = {}): NodeComponent[] | void {
    if (typeof props.list !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const list = params[props.list];
    const alias: string = props.as;
    const extracts: PropAlias[] = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    const result: NodeComponent[] = [];
    for (const item of list) {
        const localParams = propAlias(params, extracts, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        result.push(...intoDom(children, localParams, _super));
    }
    return result;
}
