import { isState } from '@aldinh777/reactive-utils/validator';
import { has } from '@aldinh777/toolbox/object/validate';
import { FlatText, Properties } from '../common/types';
import { readAlias } from '../common/prop-util';
import {
    FlatResult,
    Component,
    RenderedResult,
    ReactiveComponent,
    RenderedElementChildren,
    RenderedElement
} from './types';

type PropertyResult = [props: Properties, events: Properties<Function>];

const processProperties = (
    params: Properties,
    props: Properties<string | FlatText>,
    events: Properties<string>
): PropertyResult => {
    const propsComp: Properties = {};
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
        const handler = params[events[event]];
        if (typeof handler === 'function') {
            eventsComp[event] = handler;
        }
    }
    return [propsComp, eventsComp];
};

const isProp = (item: FlatResult): item is FlatText => item.length === 1;
const isElementChildren = (item: RenderedResult): item is RenderedElementChildren =>
    !has(item, 'items');

export async function render(
    tree: FlatResult[],
    params: Properties,
    component: Component,
    isRoot: boolean = false
): Promise<RenderedResult[]> {
    const renderResult: RenderedResult[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            renderResult.push(item);
        } else if (isProp(item)) {
            const param = params[item[0]] as any;
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
                const reactiveComponent = params[tag] as ReactiveComponent;
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
                const reactiveElement: RenderedElement = {
                    tag,
                    props: componentProps,
                    events: componentEvents,
                    children: []
                };
                const childrenResult = await render(children, params, component);
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
