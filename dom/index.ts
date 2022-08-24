import { observe, State } from '@aldinh777/reactive';
import { Properties, StaticProperties, TextProp } from '../util';
import { Component, RCMLResult } from '..';
import { cloneSetVal, PropAlias, propMapClone, propObjClone } from './dom-util';

export type NodeComponent = Node | ControlComponent;
export type EventDispatcher = (name: string, ...args: any[]) => any;
export type ReactiveComponent = (
    props: Properties,
    _children?: ComponentChildren,
    dispatch?: EventDispatcher
) => NodeComponent[];

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

function recursiveControl(handler: (par: Node, item: Node, bef?: Node) => any) {
    function recurse(parent: Node, items: NodeComponent[]) {
        for (const item of items) {
            if (item instanceof Node) {
                handler(parent, item);
            } else {
                recurse(parent, item.elems);
            }
        }
    }
    return recurse;
}

export const appendItems = recursiveControl((par, item) => par.appendChild(item));
export const removeItems = recursiveControl((par, item) => par.removeChild(item));
export function insertItemsBefore(parent: Node, child: Node, items: NodeComponent[]) {
    for (const item of items) {
        if (item instanceof Node) {
            parent.insertBefore(item, child);
        } else {
            insertItemsBefore(parent, child, item.elems);
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
            const chomp: ComponentChildren = {
                tree: children,
                params: params,
                _super: cc
            };
            switch (tag) {
                case 'children':
                    if (cc) {
                        result.push(...intoDom(cc.tree, cc.params, cc._super));
                    }
                    break;
                case 'if':
                    const ifkey = props.condition;
                    if (typeof ifkey === 'string' && params[ifkey]) {
                        result.push(...intoDom(children, params, cc));
                    }
                    break;
                case 'unless':
                    const unkey = props.condition;
                    if (typeof unkey === 'string' && !params[unkey]) {
                        result.push(...intoDom(children, params, cc));
                    }
                    break;
                case 'foreach':
                    const listkey = props.list;
                    const alias = props.as;
                    if (typeof listkey === 'string' && typeof alias === 'string') {
                        const list = params[listkey];
                        for (const item of list) {
                            const localparams = cloneSetVal(params, alias, item);
                            result.push(...intoDom(children, localparams, cc));
                        }
                    }
                    break;
                case 'destruct':
                    const objkey = props.object;
                    const propquery = props.as;
                    if (typeof objkey === 'string' && typeof propquery === 'string') {
                        const obj = params[objkey];
                        const propnames: PropAlias[] = propquery.split(/\s+/).map((query) => {
                            const matches = query.match(/(.+):(.+)/);
                            if (matches) {
                                const [_, alias, prop] = matches;
                                return [alias, prop];
                            } else {
                                return [query, query];
                            }
                        });
                        const localparams =
                            obj instanceof Map
                                ? propMapClone(params, propnames, obj)
                                : propObjClone(params, propnames, obj);
                        result.push(...intoDom(children, localparams, cc));
                    }
                    break;
                default:
                    if (tag[0].match(/[A-Z]/)) {
                        const component: ReactiveComponent = params[tag];
                        const pres = processComponentProperties(props, events, params);
                        result.push(
                            ...component(pres.props, chomp, (name: string, ...args: any[]) => {
                                const event = pres.events[name];
                                if (typeof event === 'function') {
                                    return event(...args);
                                }
                            })
                        );
                    } else {
                        const elem = document.createElement(tag);
                        const pres = processComponentProperties(props, events, params);
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

export function simpleDom(tree: RCMLResult[]): NodeComponent[] {
    const result: NodeComponent[] = [];
    for (const item of tree) {
        if (typeof item === 'string') {
            result.push(document.createTextNode(item));
        } else if (Reflect.has(item, 'name')) {
            result.push(document.createTextNode(`{${(item as TextProp).name}}`));
        } else {
            const { tag, props, children } = item as Component;
            const elem = document.createElement(tag);
            for (const prop in props) {
                const value = props[prop];
                setElementAttribute(elem, prop, value);
            }
            appendItems(elem, simpleDom(children));
            result.push(elem);
        }
    }
    return result;
}
