import { State } from '@aldinh777/reactive/state/State';
import { Properties, StaticProperties, TextProp } from '../util';
import { Component, RCMLResult } from '..';
import { append, setAttr } from './dom-util';

export type NodeComponent = Node | ControlComponent;
export type EventDispatcher = (name: string, ...args: any[]) => any;
export type ReactiveComponent = (
    props: Properties,
    _children?: ComponentChildren,
    dispatch?: EventDispatcher
) => NodeComponent[] | void;

export interface ControlComponent {
    elems: NodeComponent[];
}
export interface ComponentChildren {
    tree: RCMLResult[];
    params: Properties;
    _super?: ComponentChildren;
}
interface PropertyResult {
    props: Properties;
    events: StaticProperties<Function>;
}

function processComponentProperties(
    props: StaticProperties<string | TextProp> = {},
    events: StaticProperties<string> = {},
    params: Properties
): PropertyResult {
    const propsComp: Properties = {};
    const eventsComp: StaticProperties<Function> = {};
    for (const prop in props) {
        const value = props[prop];
        if (typeof value === 'string') {
            propsComp[prop] = value;
        } else {
            propsComp[prop] = params[value.name];
        }
    }
    for (const event in events) {
        eventsComp[event] = params[events[event]];
    }
    return { props: propsComp, events: eventsComp };
}

function processElementProperties(
    elem: HTMLElement,
    props: Properties,
    events: StaticProperties<Function>
) {
    for (const prop in props) {
        const propval = props[prop];
        if (propval instanceof State) {
            setAttr(elem, prop, propval.getValue());
            propval.onChange((next) => setAttr(elem, prop, next``));
        } else {
            setAttr(elem, prop, propval);
        }
    }
    for (const event in events) {
        const listener = events[event] as EventListener;
        elem.addEventListener(event, listener);
    }
}

export function intoDom(
    tree: RCMLResult[],
    params: Properties,
    cc?: ComponentChildren
): NodeComponent[] {
    const result: NodeComponent[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            result.push(document.createTextNode(item));
        } else if (Reflect.has(item, 'name')) {
            const param = params[(item as TextProp).name];
            const text = document.createTextNode('');
            if (param instanceof State) {
                text.textContent = param.getValue();
                param.onChange((next) => (text.textContent = next));
            } else {
                text.textContent = param;
            }
            result.push(text);
        } else {
            const { tag, props, events, children } = item as Component;
            const comps = processComponentProperties(props, events, params);
            if (tag[0].match(/[A-Z]/)) {
                const chomp: ComponentChildren = {
                    tree: children,
                    params: params,
                    _super: cc
                };
                const component: ReactiveComponent = params[tag];
                const res = component(comps.props, chomp, (name: string, ...args: any[]) => {
                    const event = comps.events[name];
                    if (typeof event === 'function') {
                        return event(...args);
                    }
                });
                if (res) {
                    result.push(...res);
                }
            } else {
                const elem = document.createElement(tag);
                processElementProperties(elem, comps.props, comps.events);
                append(elem, intoDom(children, params, cc));
                result.push(elem);
            }
        }
    }
    return result;
}
