import { isState } from '@aldinh777/reactive-utils/validator';
import { FlatText, Properties } from '../common/types';
import { RCElement, RCElementChildren } from './element';
import { readAlias } from './prop-util';
import { RCResult, Component, RenderResult, ReactiveComponent } from './types';

type PropertyResult = [props: Properties<any>, events: Properties<Function>];

const processProperties = (
    params: Properties<any>,
    props: Properties<string | FlatText>,
    events: Properties<string>
): PropertyResult => {
    const propsComp: Properties<any> = {};
    const eventsComp: Properties<Function> = {};
    for (const prop in props) {
        const value = props[prop];
        if (typeof value === 'string') {
            propsComp[prop] = value;
        } else {
            const [propname] = value;
            propsComp[prop] = params[propname];
        }
    }
    for (const event in events) {
        eventsComp[event] = params[events[event]];
    }
    return [propsComp, eventsComp];
};

const isProp = (item: RCResult): item is FlatText => item.length === 1;
const isElementChildren = (item: RenderResult): item is RCElementChildren =>
    typeof item !== 'object' || !Reflect.has(item, 'items');

export function render(
    tree: RCResult[],
    params: Properties<any>,
    component: Component,
    isRoot: boolean = false
): RenderResult[] {
    const renderResult: RenderResult[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            renderResult.push(item);
        } else if (isProp(item)) {
            const param = params[item[0]];
            if (isState(param)) {
                renderResult.push(param);
            } else {
                renderResult.push(String(param));
            }
        } else {
            const [tag, props, events, children] = item;
            const [componentProps, componentEvents] = processProperties(params, props, events);
            const extracts = typeof props.extract === 'string' ? readAlias(props.extract) : [];
            if (tag[0].match(/[A-Z]/)) {
                const componentContext: Component = {
                    children,
                    params,
                    extracts: component?.extracts?.concat(extracts) || [],
                    _super: component
                };
                const reactiveComponent: ReactiveComponent = params[tag];
                if (typeof reactiveComponent !== 'function') {
                    throw Error(`undefined or invalid component : '${tag}'`);
                }
                const componentResult = reactiveComponent(
                    componentProps,
                    componentContext,
                    (name, ...args) => {
                        const event = componentEvents[name];
                        if (typeof event === 'function') {
                            return event(...args);
                        }
                    }
                );
                if (componentResult) {
                    renderResult.push(...componentResult);
                }
            } else {
                const reactiveElement = new RCElement(tag, componentProps, componentEvents);
                const childrenResult = render(children, params, component);
                if (childrenResult.every(isElementChildren)) {
                    reactiveElement.children = childrenResult;
                    renderResult.push(reactiveElement);
                } else {
                    renderResult.push({ root: reactiveElement, items: childrenResult });
                }
            }
        }
    }
    return isRoot ? [{ component, items: renderResult }] : renderResult;
}
