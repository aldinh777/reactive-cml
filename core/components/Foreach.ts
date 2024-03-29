import { Properties } from '../types';
import { PropAlias, readAlias, propAlias } from '../prop-util';
import { render } from '../render';
import { Context, RenderedResult } from '../types';

export = async function Foreach(
    props: Properties = {},
    component: Context = {}
): Promise<RenderedResult[] | void> {
    if (typeof props.list !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const list = (params[props.list] as any[]) || [];
    const alias = props.as as string;
    const extracts: PropAlias[] = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    const result: RenderedResult[] = [];
    for (const item of list) {
        const localParams = propAlias(params, extracts, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        result.push(...(await render(children, localParams, _super)));
    }
    return result;
};
