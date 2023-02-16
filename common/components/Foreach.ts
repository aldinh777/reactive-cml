import { Properties } from '../types';
import { PropAlias, readAlias, propAlias } from '../prop-util';
import { render } from '../../core/render';
import { Component, RenderedResult } from '../../core/types';

export default function Foreach(
    props: Properties = {},
    component: Component = {}
): RenderedResult[] | void {
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
        result.push(...render(children, localParams, _super));
    }
    return result;
}
