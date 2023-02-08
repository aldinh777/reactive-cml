import { RCResult, Component, RenderResult, RCFlatElement, RCElement } from '../../core/types';

export function simpleRender(
    tree: RCResult[],
    component: Component,
    isRoot: boolean = false
): RenderResult[] {
    const renderResult: RenderResult[] = [];
    for (const item of tree as (string | RCFlatElement)[]) {
        if (typeof item === 'string') {
            renderResult.push(item);
        } else {
            const [tag, props, , children] = item;
            const element = {
                tag,
                props,
                events: {},
                children: simpleRender(children, component) as (RCElement | string)[]
            };
            renderResult.push(element);
        }
    }
    return isRoot ? [{ component, items: renderResult }] : renderResult;
}
