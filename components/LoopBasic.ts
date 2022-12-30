import { Context, NodeComponent, intoDom } from '../dom';
import { Properties } from '../util';
import { PropAlias, readAlias, propAlias } from '../dom/prop-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.list !== 'string') {
        return;
    }
    const { children, params, _super } = context;
    const list = params[props.list];
    const alias: string = props.as;
    const extracts: PropAlias[] =
        typeof props.extract === 'string' ? readAlias(props.extract) : [];
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