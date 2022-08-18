import { CMLTree } from '@aldinh777/cml-parser';
import { StateList, StateMap } from '@aldinh777/reactive/collection';
import { observe, observeAll, State } from '@aldinh777/reactive';
import { Properties, PropAlias } from '../types';
import {
    cloneMapWithAlias,
    cloneObjWithAlias,
    cloneObjWithValue,
    isReactive,
    statifyObj,
    undupe
} from '../util';

type NodeComponent = Node | ControlComponent;

interface ControlComponent {
    elems: NodeComponent[];
    marker: Node;
}
interface MirrorElement {
    startMarker: Text;
    endMarker: Text;
    elems: NodeComponent[];
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

export function insertItemsBefore(parent: Node, child: Node, items: NodeComponent[]) {
    for (const item of items) {
        if (item instanceof Node) {
            parent.insertBefore(item, child);
        } else {
            insertItemsBefore(parent, child, item.elems);
            parent.insertBefore(item.marker, child);
        }
    }
}

function processTextNode(item: string, params: Properties): Text {
    const matches = item.matchAll(/\{\s*(.*?)\s*?\}/g);
    const matchesState = undupe(Array.from(matches).map(m => m[1]));
    const literalKeys = matchesState.filter(key => !(params[key] instanceof State));
    const stateKeys = matchesState.filter(key => params[key] instanceof State);
    let text = item;
    for (const key of literalKeys) {
        const value = params[key];
        text = text.replace(RegExp(`\\{\\s*${key}\\s*?}`, 'g'), value);
    }
    const elem = document.createTextNode(text);
    if (stateKeys.length > 0) {
        const states: State<any>[] = stateKeys.map(key => params[key]);
        observeAll(states, values => {
            let replacedText = text;
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                const key = stateKeys[i];
                replacedText = replacedText.replace(RegExp(`\\{\\s*${key}\\s*?}`, 'g'), value.toString());
            }
            elem.textContent = replacedText;
        });
    }
    return elem;
}

function processComponentProperties(props: Properties, params: Properties): Properties {
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

function processElementProperties(elem: HTMLElement, props: Properties, params: Properties) {
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
                    observe(state, value => setElementAttribute(elem, attr, value));
                } else {
                    setElementAttribute(elem, attr, value);
                }
            }
        } else {
            setElementAttribute(elem, key, value);
        }
    }
}

function createFlatListElement(params: Properties, alias: string, items: any[], children: CMLTree): NodeComponent[] {
    const elements: NodeComponent[] = [];
    for (const item of items) {
        const localParams: Properties = Object.assign({}, params);
        localParams[alias] = item;
        for (const elem of intoDom(children, localParams)) {
            elements.push(elem);
        }
    }
    return elements;
}

function createListElement(params: Properties, alias: string, items: any[], children: CMLTree): NodeComponent[][] {
    const result: NodeComponent[][] = [];
    for (const item of items) {
        const localParams: Properties = cloneObjWithValue(params, alias, item);
        result.push(intoDom(children, localParams));
    }
    return result;
}

function componentControl(condition: State<any>, children: CMLTree, params: Properties): ControlComponent {
    const hide = document.createElement('div');
    const marker = document.createTextNode('');
    const elements = intoDom(children, params);
    const component: ControlComponent = {
        elems: [],
        marker: marker
    };
    if (condition.getValue()) {
        component.elems = elements;
    } else {
        appendItems(hide, elements);
    }
    observe(condition, append => {
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
    })
    return component;
}

function componentLoopState(list: State<any[]>, alias: string, children: CMLTree, params: Properties): ControlComponent {
    const listComponent: ControlComponent = {
        elems: createFlatListElement(params, alias, list.getValue(), children),
        marker: document.createTextNode('')
    };
    observe(list, items => {
        const { elems, marker } = listComponent;
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        const newListElements: NodeComponent[] = createFlatListElement(
            params, alias, items, children
        );
        removeItems(parentNode, elems);
        insertItemsBefore(parentNode, marker, newListElements);
        listComponent.elems = newListElements;
    });
    return listComponent;
}

function componentLoopList(list: StateList<any>, alias: string, children: CMLTree, params: Properties): ControlComponent {
    const listMarker = document.createTextNode('');
    const listElementEach = createListElement(params, alias, list.toArray(), children);
    const mirrorList: MirrorElement[] = listElementEach.map(elems => ({
        startMarker: document.createTextNode(''),
        endMarker: document.createTextNode(''),
        elems: elems
    }));
    const listComponent: ControlComponent = {
        elems: mirrorList.map(m => [
            m.startMarker,
            ...m.elems,
            m.endMarker
        ]).flat(),
        marker: listMarker
    };
    list.onUpdate((index, next) => {
        const { startMarker, endMarker, elems: oldElems } = mirrorList[index];
        const { parentNode } = endMarker;
        if (!parentNode) {
            return;
        }
        const newElems = intoDom(children, cloneObjWithValue(params, alias, next));
        removeItems(parentNode, oldElems);
        insertItemsBefore(parentNode, endMarker, newElems);
        mirrorList[index].elems = newElems;
        const elementIndex = listComponent.elems.indexOf(startMarker);
        listComponent.elems.splice(elementIndex + 1, oldElems.length, ...newElems);
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
        const startMarker = document.createTextNode('');
        const endMarker = document.createTextNode('');
        const newElems = intoDom(children, cloneObjWithValue(params, alias, inserted));
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
        } else {
            mirrorList.splice(index, 0, mirror);
            const elementIndex = listComponent.elems.indexOf(nextMarker);
            listComponent.elems.splice(elementIndex, 0, ...flatNewElems);
        }
    });
    return listComponent;
}

function componentDestructState(obj: State<any>, aliases: PropAlias[], children: CMLTree, params: Properties): ControlComponent {
    const destructParams = cloneObjWithAlias(params, aliases, obj.getValue());
    const destructComponent: ControlComponent = {
        elems: intoDom(children, destructParams),
        marker: document.createTextNode('')
    };
    observe(obj, ob => {
        const { elems, marker } = destructComponent;
        const { parentNode } = marker;
        if (!parentNode) {
            return;
        }
        removeItems(parentNode, elems);
        const destructParams = cloneObjWithAlias(params, aliases, ob);
        const destructElements = intoDom(children, destructParams)
        insertItemsBefore(parentNode, marker, destructElements);
        destructComponent.elems = destructElements;
    });
    return destructComponent;
}

function componentDestructMap(map: StateMap<any>, aliases: PropAlias[], children: CMLTree, params: Properties): ControlComponent {
    const destructMarker = document.createTextNode('');
    const destructParams = cloneMapWithAlias(params, aliases, map.getRawMap());
    const statifiedParams = statifyObj(destructParams, aliases);
    const destructComponent: ControlComponent = {
        elems: intoDom(children, statifiedParams),
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

export function intoDom(items: CMLTree, params: Properties): NodeComponent[] {
    const result: NodeComponent[] = [];
    for (const item of items) {
        if (typeof item === 'string') {
            const text = processTextNode(item, params)
            result.push(text);
        } else {
            const { tag, props, children } = item;
            switch (tag) {
                case 'if':
                    const ifKey: string = props['condition'];
                    const ifCondition: boolean | State<boolean> = params[ifKey];
                    if (ifCondition instanceof State) {
                        result.push(componentControl(ifCondition, children, params));
                    } else if (ifCondition) {
                        for (const elem of intoDom(children, params)) {
                            result.push(elem);
                        }
                    }
                    break;

                case 'unless':
                    const unlessKey: string = props['condition'];
                    const unlessCondition: boolean | State<boolean> = params[unlessKey];
                    if (unlessCondition instanceof State) {
                        const rev = new State(unlessCondition.getValue());
                        unlessCondition.onChange(condition => rev.setValue(!condition));
                        result.push(componentControl(rev, children, params));
                    } else if (!unlessCondition) {
                        for (const elem of intoDom(children, params)) {
                            result.push(elem);
                        }
                    }
                    break;

                case 'foreach':
                    const listName: string = props['list'];
                    const listAlias: string = props['as'];
                    const list: any[] | State<any[]> | StateList<any> = params[listName];
                    if (list instanceof State) {
                        result.push(componentLoopState(list, listAlias, children, params));
                    } else if (list instanceof StateList) {
                        result.push(componentLoopList(list, listAlias, children, params));
                    } else {
                        for (const item of list) {
                            const localParams = cloneObjWithValue(params, listAlias, item);
                            for (const elem of intoDom(children, localParams)) {
                                result.push(elem);
                            }
                        }
                    }
                    break;

                case 'destruct':
                    const objKey: string = props['object'];
                    const propQuery: string = props['as'];
                    const obj: any = params[objKey];
                    const propNames: PropAlias[] = propQuery.split(/\s+/).map(query => {
                        const matches = query.match(/(.+):(.+)/);
                        if (matches) {
                            const [_, alias, prop] = matches;
                            return { alias, prop };
                        } else {
                            return { alias: query, prop: query };
                        }
                    });
                    if (obj instanceof State) {
                        result.push(componentDestructState(obj, propNames, children, params));
                    } else if (obj instanceof StateMap) {
                        result.push(componentDestructMap(obj, propNames, children, params));
                    } else if (obj instanceof Map) {
                        const destructParams = cloneMapWithAlias(params, propNames, obj);
                        for (const elem of intoDom(children, destructParams)) {
                            result.push(elem);
                        }
                    } else {
                        const destructParams = cloneObjWithAlias(params, propNames, obj);
                        for (const elem of intoDom(children, destructParams)) {
                            result.push(elem);
                        }
                    }
                    break;

                default:
                    if (tag[0] === tag[0].toUpperCase() && tag[0].match(/\w/)) {
                        const component = params[tag];
                        const properties = processComponentProperties(props, params);
                        for (const elem of component(properties)) {
                            result.push(elem);
                        }
                    } else {
                        const elem = document.createElement(tag);
                        processElementProperties(elem, props, params);
                        appendItems(elem, intoDom(children, params));
                        result.push(elem);
                    }
                    break;
            }
        }
    }
    return result;
}
