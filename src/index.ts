import { CMLTree } from '@aldinh777/cml-parser';
import { StateList, StateMap } from '@aldinh777/reactive/collection';
import { observe, State } from '@aldinh777/reactive';
import {
    PropAlias,
    Properties,
    cloneMapWithAlias,
    cloneObjWithAlias,
    cloneObjWithValue,
    isReactive,
    statifyObj
} from '../util';

type NodeComponent = Node | ControlComponent;
type ReactiveComponent = (
    props: Properties,
    children: ComponentChildren
) => NodeComponent[];

interface ControlComponent {
    elems: NodeComponent[];
    marker: Node;
}
interface MirrorElement {
    startMarker: Text;
    endMarker: Text;
    elems: NodeComponent[];
}
interface ComponentChildren {
    structure: CMLTree;
    superProps: Properties;
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

function processTextNode(text: string, params: Properties): Text[] {
    const streamResult = [];
    let stream = '';
    let propName = '';
    let propFlag = false;
    let propNameFlag = false;
    let propSpaceLeftFlag = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (propFlag) {
            if (propSpaceLeftFlag) {
                if (c === '{') {
                    stream += '{' + propName;
                    propName = '';
                } else if (c === '}') {
                    propFlag = false;
                    propSpaceLeftFlag = false;
                    stream += '{' + propName + '}';
                } else if (c.match(/[^\s]/)) {
                    propSpaceLeftFlag = false;
                    propNameFlag = true;
                    propName += c;
                } else {
                    propName += c;
                }
            } else if (propNameFlag) {
                if (c === '{') {
                    propNameFlag = false;
                    propSpaceLeftFlag = true;
                    stream += '{' + propName;
                    propName = '';
                } else if (
                    c === '}' &&
                    propName.match(/^\s*[\$_A-Za-z][\$_\w]*/)
                ) {
                    propFlag = false;
                    const t = params[propName.trim()];
                    if (t instanceof State) {
                        const rawText = document.createTextNode(stream);
                        const stateText = document.createTextNode('');
                        observe(t, (text) => (stateText.textContent = text));
                        streamResult.push(rawText, stateText);
                        stream = '';
                        propName = '';
                    } else {
                        stream += t;
                        propName = '';
                    }
                } else if (c.match(/\s/)) {
                    propNameFlag = false;
                    propName += c;
                } else if (c.match(/[\$_\w]/)) {
                    propName += c;
                } else {
                    propNameFlag = false;
                    propFlag = false;
                    stream += '{' + propName + c;
                    propName = '';
                }
            } else {
                if (c === '}' && propName.match(/^\s*[\$_A-Za-z][\$_\w]*/)) {
                    propFlag = false;
                    const t = params[propName.trim()];
                    if (t instanceof State) {
                        const rawText = document.createTextNode(stream);
                        const stateText = document.createTextNode('');
                        observe(t, (text) => (stateText.textContent = text));
                        streamResult.push(rawText, stateText);
                        stream = '';
                        propName = '';
                    } else {
                        stream += t;
                        propName = '';
                    }
                } else if (c.match(/\s/)) {
                    propName += c;
                } else {
                    propFlag = false;
                    stream += '{' + propName + c;
                    propName = '';
                }
            }
        } else {
            if (c === '\\' && text[i + 1] === '{') {
                stream += '\\{';
                i++;
                continue;
            } else if (c === '{') {
                propFlag = true;
                propSpaceLeftFlag = true;
            } else {
                stream += c;
            }
        }
    }
    if (propFlag) {
        stream += '{' + propName;
    }
    if (stream) {
        streamResult.push(document.createTextNode(stream));
    }
    return streamResult;
}

function processComponentProperties(
    props: Properties,
    params: Properties
): Properties {
    const properties: Properties = {};
    for (const key in props) {
        const value = props[key];
        const matches = key.match(/(on|bind):(.+)/);
        if (matches) {
            const [_, type, attr] = matches;
            if (type === 'on') {
                const listener = params[value];
                properties[attr] = listener;
            } else if (type === 'bind') {
                const state = params[value];
                properties[attr] = state;
            }
        } else {
            properties[key] = value;
        }
    }
    return properties;
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
    params: Properties
) {
    for (const key in props) {
        const value = props[key];
        const matches = key.match(/(on|bind):(.+)/);
        if (matches) {
            const [_, type, attr] = matches;
            if (type === 'on') {
                const listener = params[value];
                elem.addEventListener(attr, listener);
            } else if (type === 'bind') {
                const state = params[value];
                if (state instanceof State) {
                    observe(state, (value) =>
                        setElementAttribute(elem, attr, value)
                    );
                } else {
                    setElementAttribute(elem, attr, value);
                }
            }
        } else {
            setElementAttribute(elem, key, value);
        }
    }
}

function createFlatListElement(
    params: Properties,
    alias: string,
    items: any[],
    children: CMLTree,
    compChildren: ComponentChildren
): NodeComponent[] {
    const elements: NodeComponent[] = [];
    for (const item of items) {
        const localParams: Properties = Object.assign({}, params);
        localParams[alias] = item;
        for (const elem of intoDom(children, localParams, compChildren)) {
            elements.push(elem);
        }
    }
    return elements;
}

function createListElement(
    params: Properties,
    alias: string,
    items: any[],
    children: CMLTree,
    compChildren: ComponentChildren
): NodeComponent[][] {
    const result: NodeComponent[][] = [];
    for (const item of items) {
        const localParams: Properties = cloneObjWithValue(params, alias, item);
        result.push(intoDom(children, localParams, compChildren));
    }
    return result;
}

function componentControl(
    condition: State<any>,
    children: CMLTree,
    params: Properties,
    compChildren: ComponentChildren
): ControlComponent {
    const hide = document.createElement('div');
    const marker = document.createTextNode('');
    const elements = intoDom(children, params, compChildren);
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
    children: CMLTree,
    params: Properties,
    compChildren: ComponentChildren
): ControlComponent {
    const listComponent: ControlComponent = {
        elems: createFlatListElement(
            params,
            alias,
            list.getValue(),
            children,
            compChildren
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
            compChildren
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
    children: CMLTree,
    params: Properties,
    compChildren: ComponentChildren
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
        compChildren
    );
    const mirrorList: MirrorElement[] = listElementEach.map((elems) => ({
        startMarker: document.createTextNode(''),
        endMarker: document.createTextNode(''),
        elems: elems
    }));
    const listComponent: ControlComponent = {
        elems: mirrorList
            .map((m) => [m.startMarker, ...m.elems, m.endMarker])
            .flat(),
        marker: listMarker
    };
    list.onUpdate((index, next) => {
        const item = statifiedList[index];
        const { startMarker, endMarker, elems: oldElems } = mirrorList[index];
        const { parentNode } = endMarker;
        if (!parentNode) {
            return;
        }
        if (item instanceof State) {
            item.setValue(next);
        } else {
            let nextItem = next;
            if (isReactive(next)) {
                nextItem = new State(next);
            }
            statifiedList[index] = nextItem;
            const newElems = intoDom(
                children,
                cloneObjWithValue(params, alias, nextItem),
                compChildren
            );
            removeItems(parentNode, oldElems);
            insertItemsBefore(parentNode, endMarker, newElems);
            mirrorList[index].elems = newElems;
            const elementIndex = listComponent.elems.indexOf(startMarker);
            listComponent.elems.splice(
                elementIndex + 1,
                oldElems.length,
                ...newElems
            );
        }
    });
    list.onDelete((index) => {
        const { startMarker, endMarker, elems } = mirrorList[index];
        const { parentNode } = endMarker;
        if (!parentNode) {
            return;
        }
        removeItems(parentNode, elems);
        parentNode.removeChild(startMarker);
        parentNode.removeChild(endMarker);
        mirrorList.splice(index, 1);
        const elementIndex = listComponent.elems.indexOf(startMarker);
        statifiedList.splice(index, 1);
        listComponent.elems.splice(elementIndex, elems.length + 2);
    });
    list.onInsert((index, inserted) => {
        const nextMirror = mirrorList[index];
        let nextMarker = listMarker;
        if (nextMirror) {
            nextMarker = nextMirror.startMarker;
        }
        const { parentNode } = nextMarker;
        if (!parentNode) {
            return;
        }
        let insertedItem = inserted;
        if (isReactive(inserted)) {
            insertedItem = new State(inserted);
        }
        const startMarker = document.createTextNode('');
        const endMarker = document.createTextNode('');
        const newElems = intoDom(
            children,
            cloneObjWithValue(params, alias, insertedItem),
            compChildren
        );
        const mirror = {
            startMarker: startMarker,
            endMarker: endMarker,
            elems: newElems
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
    obj: State<any>,
    aliases: PropAlias[],
    children: CMLTree,
    params: Properties,
    compChildren: ComponentChildren
): ControlComponent {
    const destructParams = cloneObjWithAlias(params, aliases, obj.getValue());
    const destructComponent: ControlComponent = {
        elems: intoDom(children, destructParams, compChildren),
        marker: document.createTextNode('')
    };
    observe(obj, (ob) => {
        const { elems, marker } = destructComponent;
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        removeItems(parentNode, elems);
        const destructParams = cloneObjWithAlias(params, aliases, ob);
        const destructElements = intoDom(
            children,
            destructParams,
            compChildren
        );
        insertItemsBefore(parentNode, marker, destructElements);
        destructComponent.elems = destructElements;
    });
    return destructComponent;
}

function componentDestructMap(
    map: StateMap<any>,
    aliases: PropAlias[],
    children: CMLTree,
    params: Properties,
    compChildren: ComponentChildren
): ControlComponent {
    const destructMarker = document.createTextNode('');
    const destructParams = cloneMapWithAlias(params, aliases, map.getRawMap());
    const statifiedParams = statifyObj(destructParams, aliases);
    const destructComponent: ControlComponent = {
        elems: intoDom(children, statifiedParams, compChildren),
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
    items: CMLTree,
    params: Properties = {},
    compChildren: ComponentChildren = {
        structure: [],
        superProps: {}
    }
): NodeComponent[] {
    const result: NodeComponent[] = [];
    for (const item of items) {
        if (typeof item === 'string') {
            const texts = processTextNode(item, params);
            for (const text of texts) {
                result.push(text);
            }
        } else {
            const { tag, props, children } = item;
            switch (tag) {
                case 'children':
                    const childrenResult = intoDom(
                        compChildren.structure,
                        compChildren.superProps
                    );
                    for (const child of childrenResult) {
                        result.push(child);
                    }
                    break;

                case 'if':
                    const ifKey: string = props['condition'];
                    const ifCondition: boolean | State<boolean> = params[ifKey];
                    if (ifCondition instanceof State) {
                        result.push(
                            componentControl(
                                ifCondition,
                                children,
                                params,
                                compChildren
                            )
                        );
                    } else if (ifCondition) {
                        for (const elem of intoDom(
                            children,
                            params,
                            compChildren
                        )) {
                            result.push(elem);
                        }
                    }
                    break;

                case 'unless':
                    const unlessKey: string = props['condition'];
                    const unlessCondition: boolean | State<boolean> =
                        params[unlessKey];
                    if (unlessCondition instanceof State) {
                        const rev = new State(!unlessCondition.getValue());
                        observe(unlessCondition, (condition) =>
                            rev.setValue(!condition)
                        );
                        result.push(
                            componentControl(
                                rev,
                                children,
                                params,
                                compChildren
                            )
                        );
                    } else if (!unlessCondition) {
                        for (const elem of intoDom(
                            children,
                            params,
                            compChildren
                        )) {
                            result.push(elem);
                        }
                    }
                    break;

                case 'foreach':
                    const listName: string = props['list'];
                    const listAlias: string = props['as'];
                    const list: any[] | State<any[]> | StateList<any> =
                        params[listName];
                    if (list instanceof State) {
                        result.push(
                            componentLoopState(
                                list,
                                listAlias,
                                children,
                                params,
                                compChildren
                            )
                        );
                    } else if (list instanceof StateList) {
                        result.push(
                            componentLoopList(
                                list,
                                listAlias,
                                children,
                                params,
                                compChildren
                            )
                        );
                    } else {
                        for (const item of list) {
                            const localParams = cloneObjWithValue(
                                params,
                                listAlias,
                                item
                            );
                            for (const elem of intoDom(
                                children,
                                localParams,
                                compChildren
                            )) {
                                result.push(elem);
                            }
                        }
                    }
                    break;

                case 'destruct':
                    const objKey: string = props['object'];
                    const propQuery: string = props['as'];
                    const obj: any = params[objKey];
                    const propNames: PropAlias[] = propQuery
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
                                propNames,
                                children,
                                params,
                                compChildren
                            )
                        );
                    } else if (obj instanceof StateMap) {
                        result.push(
                            componentDestructMap(
                                obj,
                                propNames,
                                children,
                                params,
                                compChildren
                            )
                        );
                    } else if (obj instanceof Map) {
                        const destructParams = cloneMapWithAlias(
                            params,
                            propNames,
                            obj
                        );
                        for (const elem of intoDom(
                            children,
                            destructParams,
                            compChildren
                        )) {
                            result.push(elem);
                        }
                    } else {
                        const destructParams = cloneObjWithAlias(
                            params,
                            propNames,
                            obj
                        );
                        for (const elem of intoDom(
                            children,
                            destructParams,
                            compChildren
                        )) {
                            result.push(elem);
                        }
                    }
                    break;

                default:
                    if (tag[0] === tag[0].toUpperCase() && tag[0].match(/\w/)) {
                        const component: ReactiveComponent = params[tag];
                        const properties = processComponentProperties(
                            props,
                            params
                        );
                        const compChildren: ComponentChildren = {
                            structure: children,
                            superProps: params
                        };
                        for (const elem of component(
                            properties,
                            compChildren
                        )) {
                            result.push(elem);
                        }
                    } else {
                        const elem = document.createElement(tag);
                        processElementProperties(elem, props, params);
                        appendItems(
                            elem,
                            intoDom(children, params, compChildren)
                        );
                        result.push(elem);
                    }
                    break;
            }
        }
    }
    return result;
}
