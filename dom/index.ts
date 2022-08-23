import { observe, State } from '@aldinh777/reactive';
import {
    Properties,
    TextProp,
    StaticProperties,
    cloneObjWithValue,
    isReactive,
    PropAlias,
    cloneMapWithAlias,
    cloneObjWithAlias,
    statifyObj
} from '../util';
import { Component, RCMLResult } from '..';
import { StateList, StateMap } from '@aldinh777/reactive/collection';

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
                case 'if':
                case 'unless':
                    result.push(...ConditionComponent(props, chomp));
                    break;
                case 'foreach':
                    result.push(...LoopComponent(props, chomp));
                    break;
                case 'destruct':
                    result.push(...DestructComponent(props, chomp));
                    break;
                default:
                    if (tag === 'children') {
                        if (cc) {
                            result.push(...intoDom(cc.tree, cc.params));
                        }
                    } else if (tag[0].match(/[A-Z]/)) {
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

/**
 * ### Condition Component
 *
 * Render children nodes only when the `condition` is true.
 * otherwise, hide children inside a hidden element.
 *
 * `condition` aquired through params object with key
 * the value of `props.condition`
 */
function ConditionComponent(
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] {
    if (!_children || typeof props.condition !== 'string') {
        return [];
    }
    const { tree, params, _super } = _children;
    const unless = props.reverse;
    const condkey = props.condition;
    let condition = _children.params[condkey];
    if (condition instanceof State) {
        if (unless) {
            const rev = new State(!condition.getValue());
            condition.onChange((un) => rev.setValue(!un));
            condition = rev;
        }
        const hide = document.createElement('div');
        const marker = document.createTextNode('');
        const elements = intoDom(tree, params, _super);
        const component: ControlComponent = { elems: [] };
        if (condition.getValue()) {
            component.elems = elements;
        } else {
            appendItems(hide, elements);
        }
        condition.onChange((append: boolean) => {
            const { parentNode } = marker;
            if (!parentNode) {
                return;
            }
            if (append) {
                removeItems(hide, elements);
                insertItemsBefore(parentNode, marker, elements);
                component.elems = elements;
            } else {
                removeItems(parentNode, elements);
                appendItems(hide, elements);
                component.elems = [];
            }
        });
        return [component, marker];
    } else {
        if (unless) {
            condition = !condition;
        }
        if (condition) {
            return intoDom(tree, params, _super);
        }
        return [];
    }
}

/**
 * ### Destruct Component
 *
 * Render children with new params by destructuring `object` or map.
 * Params names depends on `props.as` and able to be given alias.
 *
 * ex : `as="username age:userAge"` would take `username` and `age` property
 * of an object and rename `age` as `userAge`
 *
 * `object` aquired through params object with key
 * the value of `props.object`
 */
function DestructComponent(props: Properties = {}, _children?: ComponentChildren): NodeComponent[] {
    if (!_children || typeof props.object !== 'string' || typeof props.as !== 'string') {
        return [];
    }
    const { tree, params, _super } = _children;
    const obj: any = params[props.object];
    const propnames: PropAlias[] = props.as.split(/\s+/).map((query) => {
        const matches = query.match(/(.+):(.+)/);
        if (matches) {
            const [_, alias, prop] = matches;
            return [alias, prop];
        } else {
            return [query, query];
        }
    });
    if (obj instanceof State) {
        const marker = document.createTextNode('');
        const destructParams =
            obj.getValue() instanceof Map
                ? cloneMapWithAlias(params, propnames, obj.getValue())
                : cloneObjWithAlias(params, propnames, obj.getValue());
        const component: ControlComponent = {
            elems: intoDom(tree, destructParams, _super)
        };
        obj.onChange((ob) => {
            const { elems } = component;
            const { parentNode } = marker;
            if (!parentNode) {
                return;
            }
            removeItems(parentNode, elems);
            const destructParams =
                ob instanceof Map
                    ? cloneMapWithAlias(params, propnames, ob)
                    : cloneObjWithAlias(params, propnames, ob);
            const destructElements = intoDom(tree, destructParams, _super);
            insertItemsBefore(parentNode, marker, destructElements);
            component.elems = destructElements;
        });
        return [component, marker];
    } else if (obj instanceof StateMap) {
        const marker = document.createTextNode('');
        const destructParams = cloneMapWithAlias(params, propnames, obj.getRawMap());
        const statifiedParams = statifyObj(destructParams, propnames);
        const component: ControlComponent = {
            elems: intoDom(tree, statifiedParams, _super)
        };
        obj.onUpdate((key, value) => {
            const param = statifiedParams[key];
            if (param instanceof State) {
                param.setValue(value);
            } else {
                if (isReactive(value)) {
                    statifiedParams[key] = value;
                } else {
                    statifiedParams[key] = new State(value);
                }
            }
        });
        obj.onDelete((key) => {
            delete statifiedParams[key];
        });
        obj.onInsert((key, value) => {
            if (isReactive(value)) {
                statifiedParams[key] = value;
            } else {
                statifiedParams[key] = new State(value);
            }
        });
        return [component, marker];
    } else {
        const destructParams =
            obj instanceof Map
                ? cloneMapWithAlias(params, propnames, obj)
                : cloneObjWithAlias(params, propnames, obj);
        return intoDom(tree, destructParams, _super);
    }
}

/**
 * ### Loop Component
 *
 * Render children iteratively dependent on the `list`
 * then pass each value as params with name provided by `props.as`
 *
 * `list` aquired through params object with key
 * the value of `props.list`
 */
function LoopComponent(props: Properties = {}, _children?: ComponentChildren): NodeComponent[] {
    if (!_children || typeof props.list !== 'string' || typeof props.as !== 'string') {
        return [];
    }
    const { tree, params, _super } = _children;
    const list = params[props.list];
    const alias = props.as;
    if (list instanceof State) {
        const marker = document.createTextNode('');
        const component: ControlComponent = {
            elems: createFlatListElement(params, alias, list.getValue(), tree, _super)
        };
        list.onChange((items) => {
            const { elems } = component;
            const { parentNode } = marker;
            if (!parentNode) {
                return;
            }
            const newListElements: NodeComponent[] = createFlatListElement(
                params,
                alias,
                items,
                tree,
                _super
            );
            removeItems(parentNode, elems);
            insertItemsBefore(parentNode, marker, newListElements);
            component.elems = newListElements;
        });
        return [component, marker];
    } else if (list instanceof StateList) {
        const marker = document.createTextNode('');
        const statifiedList = list
            .toArray()
            .map((item) => (isReactive(item) ? item : new State(item)));
        const listElementEach = createListElement(params, alias, statifiedList, tree, _super);
        const mirrorList: (MirrorElement | undefined)[] = listElementEach.map((elems) => ({
            elems: elems,
            start: document.createTextNode(''),
            end: document.createTextNode('')
        }));
        const component: ControlComponent = {
            elems: mirrorList.flatMap((m) => (m ? [m.start, ...m.elems, m.end] : []))
        };
        list.onUpdate((index, next) => {
            const item = statifiedList[index];
            if (item instanceof State) {
                item.setValue(next);
            } else {
                const mirronElement = mirrorList[index];
                const nextItem = isReactive(next) ? next : new State(next);
                statifiedList[index] = nextItem;
                const newElems = intoDom(tree, cloneObjWithValue(params, alias, nextItem), _super);
                if (mirronElement) {
                    const { start: startMarker, end: endMarker, elems } = mirronElement;
                    const { parentNode } = endMarker;
                    if (!parentNode) {
                        return;
                    }
                    removeItems(parentNode, elems);
                    insertItemsBefore(parentNode, endMarker, newElems);
                    mirronElement.elems = newElems;
                    const elementIndex = component.elems.indexOf(startMarker);
                    component.elems.splice(elementIndex + 1, elems.length, ...newElems);
                } else {
                    const m: MirrorElement = {
                        elems: newElems,
                        start: document.createTextNode(''),
                        end: document.createTextNode('')
                    };
                    const flatElems = [m.start, ...m.elems, m.end];
                    mirrorList[index] = m;
                    if (index >= mirrorList.length) {
                        const { parentNode } = marker;
                        if (parentNode) {
                            insertItemsBefore(parentNode, marker, flatElems);
                        }
                    } else {
                        let i = index + 1;
                        while (i < mirrorList.length) {
                            const mirror = mirrorList[i];
                            if (mirror) {
                                const { start: startMarker } = mirror;
                                const { parentNode } = startMarker;
                                if (parentNode) {
                                    insertItemsBefore(parentNode, startMarker, flatElems);
                                }
                                break;
                            }
                            i++;
                        }
                        if (i === mirrorList.length) {
                            const { parentNode } = marker;
                            if (parentNode) {
                                insertItemsBefore(parentNode, marker, flatElems);
                            }
                        }
                    }
                }
            }
        });
        list.onDelete((index) => {
            const mirrorElement = mirrorList[index];
            if (mirrorElement) {
                const { start: startMarker, end: endMarker, elems } = mirrorElement;
                const { parentNode } = endMarker;
                if (!parentNode) {
                    return;
                }
                removeItems(parentNode, elems);
                parentNode.removeChild(startMarker);
                parentNode.removeChild(endMarker);
                const elementIndex = component.elems.indexOf(startMarker);
                component.elems.splice(elementIndex, elems.length + 2);
            }
            mirrorList.splice(index, 1);
            statifiedList.splice(index, 1);
        });
        list.onInsert((index, inserted) => {
            const nextMirror = mirrorList[index];
            let nextMarker = marker;
            if (nextMirror) {
                nextMarker = nextMirror.start;
            }
            const { parentNode } = nextMarker;
            if (!parentNode) {
                return;
            }
            const insertedItem = isReactive(inserted) ? inserted : new State(inserted);
            const startMarker = document.createTextNode('');
            const endMarker = document.createTextNode('');
            const newElems = intoDom(tree, cloneObjWithValue(params, alias, insertedItem), _super);
            const mirror: MirrorElement = {
                elems: newElems,
                start: startMarker,
                end: endMarker
            };
            const flatNewElems = [startMarker, ...newElems, endMarker];
            insertItemsBefore(parentNode, nextMarker, flatNewElems);
            parentNode.insertBefore(startMarker, nextMarker);
            if (nextMarker === marker) {
                mirrorList.push(mirror);
                component.elems.push(...flatNewElems);
                statifiedList.push(insertedItem);
            } else {
                mirrorList.splice(index, 0, mirror);
                const elementIndex = component.elems.indexOf(nextMarker);
                component.elems.splice(elementIndex, 0, ...flatNewElems);
                statifiedList.splice(index, 0, insertedItem);
            }
        });
        return [component, marker];
    } else {
        const elems: NodeComponent[] = [];
        for (const item of list) {
            const localParams = cloneObjWithValue(params, props.as, item);
            elems.push(...intoDom(tree, localParams, _super));
        }
        return elems;
    }
}

interface MirrorElement {
    elems: NodeComponent[];
    start: Text;
    end: Text;
}

function createFlatListElement(
    params: Properties,
    alias: string,
    items: any[],
    tree: RCMLResult[],
    cc?: ComponentChildren
): NodeComponent[] {
    const elems: NodeComponent[] = [];
    for (const item of items) {
        const localParams: Properties = cloneObjWithValue(params, alias, item);
        elems.push(...intoDom(tree, localParams, cc));
    }
    return elems;
}

function createListElement(
    params: Properties,
    alias: string,
    items: any[],
    children: RCMLResult[],
    cc?: ComponentChildren
): NodeComponent[][] {
    const result: NodeComponent[][] = [];
    for (const item of items) {
        const localParams: Properties = cloneObjWithValue(params, alias, item);
        result.push(intoDom(children, localParams, cc));
    }
    return result;
}
