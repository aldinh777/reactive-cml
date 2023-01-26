import { Properties } from '../../common/types';
import { RCElement } from '../../core/element';
import { RCResult, Component, RenderResult, RCFlatElement } from '../../core/types';

export function simpleRender(
    tree: RCResult[],
    params?: Properties<any>,
    component?: Component,
    isRoot: boolean = false
): RenderResult[] {
    const renderResult: RenderResult[] = [];
    for (const item of tree as (string | RCFlatElement)[]) {
        if (typeof item === 'string') {
            renderResult.push(item);
        } else {
            const [tag, props, , children] = item;
            const reactiveElement = new RCElement(tag, props, {});
            reactiveElement.children = simpleRender(children, params, component) as (
                | RCElement
                | string
            )[];
        }
    }
    return isRoot ? [{ component, items: renderResult }] : renderResult;
}
