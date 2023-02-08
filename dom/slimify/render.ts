import { FlatResult, Component, RenderedResult, FlatElement, RenderedElement } from '../../core/types';

export function simpleRender(
    tree: FlatResult[],
    component: Component,
    isRoot: boolean = false
): RenderedResult[] {
    const renderResult: RenderedResult[] = [];
    for (const item of tree as (string | FlatElement)[]) {
        if (typeof item === 'string') {
            renderResult.push(item);
        } else {
            const [tag, props, , children] = item;
            const element = {
                tag,
                props,
                events: {},
                children: simpleRender(children, component) as (RenderedElement | string)[]
            };
            renderResult.push(element);
        }
    }
    return isRoot ? [{ component, items: renderResult }] : renderResult;
}
