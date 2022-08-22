import { observe, State } from '@aldinh777/reactive';
import { Properties, TextProp, StaticProperties } from '../util';
import { Component, RCMLResult } from '..';
import ControlComponent from './components/ControlComponent';
import LoopComponent from './components/LoopComponent';
import DestructComponent from './components/DestructComponent';

export type NodeComponent = Node | ControlComponent;
export type EventDispatcher = (name: string, ...args: any[]) => any;
export type ReactiveComponent = (
    props: Properties,
    _children?: ComponentChildren,
    dispatch?: EventDispatcher
) => NodeComponent[];

export interface ControlComponent {
    elems: NodeComponent[];
    marker: Node;
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

export function appendItems(parent: Node, items: NodeComponent[]) {
    for (const item of items) {
        if (item instanceof Node) {
            parent.appendChild(item);
        } else {
            appendItems(parent, item.elems);
            parent.appendChild(item.marker);
        }
    }
}

export function removeItems(parent: Node, items: NodeComponent[]) {
    for (const item of items) {
        if (item instanceof Node) {
            parent.removeChild(item);
        } else {
            removeItems(parent, item.elems);
            parent.removeChild(item.marker);
        }
    }
}

export function insertItemsBefore(
    parent: Node,
    child: Node,
    items: NodeComponent[]
) {
    for (const item of items) {
        if (item instanceof Node) {
            parent.insertBefore(item, child);
        } else {
            insertItemsBefore(parent, child, item.elems);
            parent.insertBefore(item.marker, child);
        }
    }
}

function processComponentProperties(
    props: StaticProperties<string | TextProp>,
    events: StaticProperties<string>,
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

function setElementAttribute(elem: HTMLElement, attr: string, value: any) {
    if (elem.hasAttribute(attr)) {
        elem.setAttribute(attr, value);
    } else {
        const att = document.createAttribute(attr);
        att.value = value;
        elem.setAttributeNode(att);
    }
}

function processElementProperties(
    elem: HTMLElement,
    props: Properties,
    events: StaticProperties<Function>
) {
    for (const prop in props) {
        const value = props[prop];
        if (value instanceof State) {
            observe(value, (next) => setElementAttribute(elem, prop, next));
        } else {
            setElementAttribute(elem, prop, value);
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
                observe(param, (next) => (text.textContent = next));
            } else {
                text.textContent = param;
            }
            result.push(text);
        } else {
            const { tag, props, events, children } = item as Component;
            switch (tag) {
                case 'children':
                    if (cc) {
                        result.push(...intoDom(cc.tree, cc.params));
                    }
                    break;
                case 'if':
                case 'unless':
                    result.push(...ControlComponent(props, cc));
                    break;
                case 'foreach':
                    result.push(...LoopComponent(props, cc));
                    break;
                case 'destruct':
                    result.push(...DestructComponent(props, cc));
                    break;
                default:
                    if (tag[0].match(/[A-Z]/)) {
                        const component: ReactiveComponent = params[tag];
                        const pres = processComponentProperties(
                            props,
                            events,
                            params
                        );
                        const childrenComp: ComponentChildren = {
                            tree: children,
                            params: params,
                            _super: cc
                        };
                        result.push(
                            ...component(
                                pres.props,
                                childrenComp,
                                (name: string, ...args: any[]) => {
                                    const event = pres.events[name];
                                    if (typeof event === 'function') {
                                        return event(...args);
                                    }
                                }
                            )
                        );
                    } else {
                        const elem = document.createElement(tag);
                        const pres = processComponentProperties(
                            props,
                            events,
                            params
                        );
                        processElementProperties(elem, pres.props, pres.events);
                        appendItems(elem, intoDom(children, params, cc));
                        result.push(elem);
                    }
                    break;
            }
        }
    }
    return result;
}
