import { State } from '@aldinh777/reactive';
import { Properties, StaticProperties, TextProp } from '../util';
import { Component, RCMLResult } from '..';
import { append, setAttr } from './dom-util';
import ComponentError from '../error/ComponentError';

type PropertyResult = [props: Properties, events: StaticProperties<Function>];
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

function processComponentProperties(
    params: Properties,
    props: StaticProperties<string | TextProp>,
    events: StaticProperties<string>
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
    return [propsComp, eventsComp];
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
            propval.onChange((next) => setAttr(elem, prop, next));
        } else {
            setAttr(elem, prop, propval);
        }
    }
    for (const event in events) {
        const listener = events[event] as EventListener;
        elem.addEventListener(event, listener);
    }
}

function createDispatcher(events: StaticProperties<Function>): EventDispatcher {
    return (name: string, ...args: any[]) => {
        const event = events[name];
        if (typeof event === 'function') {
            return event(...args);
        }
    };
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
            const [tag, props, events, children] = item as Component;
            const [propsComp, eventsComp] = processComponentProperties(params, props, events);
            if (tag[0].match(/[A-Z]/)) {
                const chomp: ComponentChildren = {
                    tree: children,
                    params: params,
                    _super: cc
                };
                const component: ReactiveComponent = params[tag];
                try {
                    const res = component(propsComp, chomp, createDispatcher(eventsComp));
                    if (res) {
                        result.push(...res);
                    }
                } catch (err) {
                    throw ComponentError.componentCrash(tag, err);
                }
            } else {
                const elem = document.createElement(tag);
                processElementProperties(elem, propsComp, eventsComp);
                append(elem, intoDom(children, params, cc));
                result.push(elem);
            }
        }
    }
    return result;
}
