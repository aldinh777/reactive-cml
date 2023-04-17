import { has } from '@aldinh777/toolbox/object/validate';
import { FlatText, Properties } from './types';
import { readAlias } from './prop-util';
import {
    FlatResult,
    Context,
    RenderedResult,
    ReactiveComponent,
    RenderedElementChildren,
    RenderedElement
} from './types';
import ComponentError from '../error/ComponentError';

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
    component: Context,
    isRoot: boolean = false
): Promise<RenderedResult[]> {
    const renderResult: RenderedResult[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            renderResult.push(item);
        } else if (isProp(item)) {
            const propname = item[0];
            renderResult.push([params[propname]]);
        } else {
            const [tag, props, events, children] = item;
            const [componentProps, componentEvents] = processProperties(params, props, events);
            const extracts = typeof props.extract === 'string' ? readAlias(props.extract) : [];
            if (tag[0].match(/[A-Z]/)) {
                const componentContext: Context = {
                    children,
                    params,
                    extracts: component?.extracts?.concat(extracts) || [],
                    _super: component
                };
                const reactiveComponent = params[tag] as ReactiveComponent;
                if (typeof reactiveComponent !== 'function') {
                    throw Error(`undefined or invalid component : '${tag}'`);
                }
                try {
                    const componentResult = await reactiveComponent(
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
                } catch (err) {
                    if (err instanceof ComponentError) {
                        const cause = err.componentTraces.at(-1);
                        throw new ComponentError(
                            `crash at component '${cause}'`,
                            [tag, ...err.componentTraces],
                            err.reason
                        );
                    } else {
                        throw new ComponentError(
                            `crash at component '${tag}'`,
                            [tag],
                            err instanceof Error ? err.message : err
                        );
                    }
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
