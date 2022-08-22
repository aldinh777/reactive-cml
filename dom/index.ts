import { observe, State } from '@aldinh777/reactive';
import { StateList, StateMap } from '@aldinh777/reactive/collection';
import {
    PropAlias,
    Properties,
    cloneMapWithAlias,
    cloneObjWithAlias,
    cloneObjWithValue,
    isReactive,
    statifyObj,
    TextProp,
    StaticProperties
} from '../util';
import { Component, RCMLResult } from '..';

type NodeComponent = Node | ControlComponent;
type EventDispatcher = (name: string, ...args: any[]) => any;
export type ReactiveComponent = (
    props: Properties,
    dispatch: EventDispatcher,
    _children: ComponentChildren
) => NodeComponent[];

interface ControlComponent {
    elems: NodeComponent[];
    marker: Node;
}
interface MirrorElement {
    elems: NodeComponent[];
    start: Text;
    end: Text;
}
interface ComponentChildren {
    tree?: RCMLResult[];
    props?: Properties;
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
): [Properties, StaticProperties<Function>] {
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

function createFlatListElement(
    params: Properties,
    alias: string,
    items: any[],
    children: RCMLResult[],
    cc: ComponentChildren
): NodeComponent[] {
    const elements: NodeComponent[] = [];
    for (const item of items) {
        const localParams: Properties = Object.assign({}, params);
        localParams[alias] = item;
        for (const elem of intoDom(children, localParams, cc)) {
            elements.push(elem);
        }
    }
    return elements;
}

function createListElement(
    params: Properties,
    alias: string,
    items: any[],
    children: RCMLResult[],
    cc: ComponentChildren
): NodeComponent[][] {
    const result: NodeComponent[][] = [];
    for (const item of items) {
        const localParams: Properties = cloneObjWithValue(params, alias, item);
        result.push(intoDom(children, localParams, cc));
    }
    return result;
}

function componentControl(
    condition: State<any>,
    children: RCMLResult[],
    params: Properties,
    cc: ComponentChildren
): ControlComponent {
    const hide = document.createElement('div');
    const marker = document.createTextNode('');
    const elements = intoDom(children, params, cc);
    const component: ControlComponent = {
        elems: [],
        marker: marker
    };
    if (condition.getValue()) {
        component.elems = elements;
    } else {
        appendItems(hide, elements);
    }
    observe(condition, (append) => {
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
    return component;
}

function componentLoopState(
    list: State<any[]>,
    alias: string,
    children: RCMLResult[],
    params: Properties,
    cc: ComponentChildren
): ControlComponent {
    const listComponent: ControlComponent = {
        elems: createFlatListElement(
            params,
            alias,
            list.getValue(),
            children,
            cc
        ),
        marker: document.createTextNode('')
    };
    observe(list, (items) => {
        const { elems, marker } = listComponent;
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        const newListElements: NodeComponent[] = createFlatListElement(
            params,
            alias,
            items,
            children,
            cc
        );
        removeItems(parentNode, elems);
        insertItemsBefore(parentNode, marker, newListElements);
        listComponent.elems = newListElements;
    });
    return listComponent;
}

function componentLoopList(
    list: StateList<any>,
    alias: string,
    children: RCMLResult[],
    params: Properties,
    cc: ComponentChildren
): ControlComponent {
    const listMarker = document.createTextNode('');
    const statifiedList = list.toArray().map((item) => {
        if (isReactive(item)) {
            return item;
        } else {
            return new State(item);
        }
    });
    const listElementEach = createListElement(
        params,
        alias,
        statifiedList,
        children,
        cc
    );
    const mirrorList: (MirrorElement | undefined)[] = listElementEach.map(
        (elems) => ({
            elems: elems,
            start: document.createTextNode(''),
            end: document.createTextNode('')
        })
    );
    const listComponent: ControlComponent = {
        elems: mirrorList.flatMap((m) =>
            m ? [m.start, ...m.elems, m.end] : []
        ),
        marker: listMarker
    };
    list.onUpdate((index, next) => {
        const item = statifiedList[index];
        if (item instanceof State) {
            item.setValue(next);
        } else {
            const mirronElement = mirrorList[index];
            let nextItem = next;
            if (!isReactive(next)) {
                nextItem = new State(next);
            }
            statifiedList[index] = nextItem;
            const newElems = intoDom(
                children,
                cloneObjWithValue(params, alias, nextItem),
                cc
            );
            if (mirronElement) {
                const {
                    start: startMarker,
                    end: endMarker,
                    elems
                } = mirronElement;
                const { parentNode } = endMarker;
                if (!parentNode) {
                    return;
                }
                removeItems(parentNode, elems);
                insertItemsBefore(parentNode, endMarker, newElems);
                mirronElement.elems = newElems;
                const elementIndex = listComponent.elems.indexOf(startMarker);
                listComponent.elems.splice(
                    elementIndex + 1,
                    elems.length,
                    ...newElems
                );
            } else {
                const m: MirrorElement = {
                    elems: newElems,
                    start: document.createTextNode(''),
                    end: document.createTextNode('')
                };
                const flatElems = [m.start, ...m.elems, m.end];
                mirrorList[index] = m;
                if (index >= mirrorList.length) {
                    const { parentNode } = listMarker;
                    if (parentNode) {
                        insertItemsBefore(parentNode, listMarker, flatElems);
                    }
                } else {
                    let i = index + 1;
                    while (i < mirrorList.length) {
                        const mirror = mirrorList[i];
                        if (mirror) {
                            const { start: startMarker } = mirror;
                            const { parentNode } = startMarker;
                            if (parentNode) {
                                insertItemsBefore(
                                    parentNode,
                                    startMarker,
                                    flatElems
                                );
                            }
                            break;
                        }
                        i++;
                    }
                    if (i === mirrorList.length) {
                        const { parentNode } = listMarker;
                        if (parentNode) {
                            insertItemsBefore(
                                parentNode,
                                listMarker,
                                flatElems
                            );
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
            const elementIndex = listComponent.elems.indexOf(startMarker);
            listComponent.elems.splice(elementIndex, elems.length + 2);
        }
        mirrorList.splice(index, 1);
        statifiedList.splice(index, 1);
    });
    list.onInsert((index, inserted) => {
        const nextMirror = mirrorList[index];
        let nextMarker = listMarker;
        if (nextMirror) {
            nextMarker = nextMirror.start;
        }
        const { parentNode } = nextMarker;
        if (!parentNode) {
            return;
        }
        let insertedItem = inserted;
        if (!isReactive(inserted)) {
            insertedItem = new State(inserted);
        }
        const startMarker = document.createTextNode('');
        const endMarker = document.createTextNode('');
        const newElems = intoDom(
            children,
            cloneObjWithValue(params, alias, insertedItem),
            cc
        );
        const mirror: MirrorElement = {
            elems: newElems,
            start: startMarker,
            end: endMarker
        };
        const flatNewElems = [startMarker, ...newElems, endMarker];
        insertItemsBefore(parentNode, nextMarker, flatNewElems);
        parentNode.insertBefore(startMarker, nextMarker);
        if (nextMarker === listMarker) {
            mirrorList.push(mirror);
            listComponent.elems.push(...flatNewElems);
            statifiedList.push(insertedItem);
        } else {
            mirrorList.splice(index, 0, mirror);
            const elementIndex = listComponent.elems.indexOf(nextMarker);
            listComponent.elems.splice(elementIndex, 0, ...flatNewElems);
            statifiedList.splice(index, 0, insertedItem);
        }
    });
    return listComponent;
}

function componentDestructState(
    obj: State<any> | State<Map<string, any>>,
    aliases: PropAlias[],
    children: RCMLResult[],
    params: Properties,
    cchildren: ComponentChildren
): ControlComponent {
    const destructParams =
        obj.getValue() instanceof Map
            ? cloneMapWithAlias(params, aliases, obj.getValue())
            : cloneObjWithAlias(params, aliases, obj.getValue());
    const destructComponent: ControlComponent = {
        elems: intoDom(children, destructParams, cchildren),
        marker: document.createTextNode('')
    };
    observe(obj, (ob) => {
        const { elems, marker } = destructComponent;
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        removeItems(parentNode, elems);
        const destructParams =
            ob instanceof Map
                ? cloneMapWithAlias(params, aliases, ob)
                : cloneObjWithAlias(params, aliases, ob);
        const destructElements = intoDom(
            children,
            destructParams,
            cchildren
        );
        insertItemsBefore(parentNode, marker, destructElements);
        destructComponent.elems = destructElements;
    });
    return destructComponent;
}

function componentDestructMap(
    map: StateMap<any>,
    aliases: PropAlias[],
    children: RCMLResult[],
    params: Properties,
    cc: ComponentChildren
): ControlComponent {
    const destructMarker = document.createTextNode('');
    const destructParams = cloneMapWithAlias(params, aliases, map.getRawMap());
    const statifiedParams = statifyObj(destructParams, aliases);
    const destructComponent: ControlComponent = {
        elems: intoDom(children, statifiedParams, cc),
        marker: destructMarker
    };
    map.onUpdate((key, value) => {
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
    map.onDelete((key) => {
        delete statifiedParams[key];
    });
    map.onInsert((key, value) => {
        if (isReactive(value)) {
            statifiedParams[key] = value;
        } else {
            statifiedParams[key] = new State(value);
        }
    });
    return destructComponent;
}

export function intoDom(
    tree: RCMLResult[],
    params: Properties = {},
    cc: ComponentChildren = {}
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
                    if (cc.tree && cc.props) {
                        const childrenResult = intoDom(cc.tree, cc.props);
                        result.push(...childrenResult);
                    }
                    break;
                case 'if':
                case 'unless':
                    if (typeof props.condition === 'string') {
                        let condition: boolean | State<boolean> =
                            params[props.condition];
                        if (condition instanceof State) {
                            if (tag === 'unless') {
                                const rev = new State(!condition.getValue());
                                condition.onChange((un) => rev.setValue(!un));
                                condition = rev;
                            }
                            result.push(
                                componentControl(
                                    condition,
                                    children,
                                    params,
                                    cc
                                )
                            );
                        } else {
                            if (tag === 'unless') {
                                condition = !condition;
                            }
                            if (condition) {
                                result.push(...intoDom(children, params, cc));
                            }
                        }
                    }
                    break;
                case 'foreach':
                    if (
                        typeof props.list === 'string' &&
                        typeof props.as === 'string'
                    ) {
                        const list = params[props.list];
                        if (list instanceof State) {
                            result.push(
                                componentLoopState(
                                    list,
                                    props.as,
                                    children,
                                    params,
                                    cc
                                )
                            );
                        } else if (list instanceof StateList) {
                            result.push(
                                componentLoopList(
                                    list,
                                    props.as,
                                    children,
                                    params,
                                    cc
                                )
                            );
                        } else {
                            for (const item of list) {
                                const localParams = cloneObjWithValue(
                                    params,
                                    props.as,
                                    item
                                );
                                result.push(
                                    ...intoDom(children, localParams, cc)
                                );
                            }
                        }
                    }
                    break;
                case 'destruct':
                    if (
                        typeof props.object === 'string' &&
                        typeof props.as === 'string'
                    ) {
                        const obj: any = params[props.object];
                        const propnames: PropAlias[] = props.as
                            .split(/\s+/)
                            .map((query) => {
                                const matches = query.match(/(.+):(.+)/);
                                if (matches) {
                                    const [_, alias, prop] = matches;
                                    return { alias, prop };
                                } else {
                                    return { alias: query, prop: query };
                                }
                            });
                        if (obj instanceof State) {
                            result.push(
                                componentDestructState(
                                    obj,
                                    propnames,
                                    children,
                                    params,
                                    cc
                                )
                            );
                        } else if (obj instanceof StateMap) {
                            result.push(
                                componentDestructMap(
                                    obj,
                                    propnames,
                                    children,
                                    params,
                                    cc
                                )
                            );
                        } else {
                            const destructParams =
                                obj instanceof Map
                                    ? cloneMapWithAlias(params, propnames, obj)
                                    : cloneObjWithAlias(params, propnames, obj);
                            result.push(
                                ...intoDom(children, destructParams, cc)
                            );
                        }
                    }
                    break;
                default:
                    if (tag[0].match(/[A-Z]/)) {
                        const component: ReactiveComponent = params[tag];
                        const [propsComp, eventsComp] =
                            processComponentProperties(props, events, params);
                        const childrenComp: ComponentChildren = {
                            tree: children,
                            props: params
                        };
                        const dispatch = (
                            name: string,
                            ...args: any[]
                        ): any => {
                            const event = eventsComp[name];
                            if (typeof event === 'function') {
                                return event(...args);
                            }
                        };
                        result.push(
                            ...component(propsComp, dispatch, childrenComp)
                        );
                    } else {
                        const elem = document.createElement(tag);
                        const [propsComp, eventsComp] =
                            processComponentProperties(props, events, params);
                        processElementProperties(elem, propsComp, eventsComp);
                        appendItems(elem, intoDom(children, params, cc));
                        result.push(elem);
                    }
                    break;
            }
        }
    }
    return result;
}
