import { CMLTree } from '@aldinh777/cml-parser';
import { StateList } from '@aldinh777/reactive/collection';
import { observe, observeAll, State } from '@aldinh777/reactive';
import { undupe } from '../util';

type NodeComponent = Node | ControlComponent;

interface Properties {
    [key: string]: any;
}
interface ControlComponent {
    elems: NodeComponent[];
    marker: Node;
}
interface PropAlias {
    alias: string;
    prop: string;
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

function cloneObjWithAlias(params: object, aliases: PropAlias[], obj: Properties): Properties {
    const ob: Properties = Object.assign({}, params);
    for (const { alias, prop } of aliases) {
        ob[alias] = obj[prop];
    }
    return ob;
}

function cloneObjWithValue(params: object, name: string, value: any): Properties {
    const ob: Properties = Object.assign({}, params);
    ob[name] = value;
    return ob;
}

function createFlatListElement(params: object, alias: string, items: any[], children: CMLTree): NodeComponent[] {
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

function createListElement(params: object, alias: string, items: any[], children: CMLTree): NodeComponent[][] {
    const result: NodeComponent[][] = [];
    for (const item of items) {
        const elements: NodeComponent[] = [];
        const localParams: Properties = Object.assign({}, params);
        localParams[alias] = item;
        for (const elem of intoDom(children, localParams)) {
            elements.push(elem);
        }
        result.push(elements);
    }
    return result;
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
                        const ifHideout = document.createElement('div');
                        const ifMarker = document.createTextNode('');
                        const ifElements = intoDom(children, params);
                        const ifComponent: ControlComponent = {
                            elems: [],
                            marker: ifMarker
                        };
                        if (ifCondition.getValue()) {
                            ifComponent.elems = ifElements;
                        } else {
                            appendItems(ifHideout, ifElements);
                        }
                        result.push(ifComponent);
                        observe(ifCondition, append => {
                            const { parentNode } = ifMarker;
                            if (!parentNode) {
                                return;
                            }
                            if (append) {
                                removeItems(ifHideout, ifElements);
                                insertItemsBefore(parentNode, ifMarker, ifElements);
                                ifComponent.elems = ifElements;
                            } else {
                                removeItems(parentNode, ifElements);
                                appendItems(ifHideout, ifElements);
                                ifComponent.elems = [];
                            }
                        })
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
                        const unlessHideout = document.createElement('div');
                        const unlessMarker = document.createTextNode('');
                        const unlessElements = intoDom(children, params);
                        const unlessComponent: ControlComponent = {
                            elems: [],
                            marker: unlessMarker
                        };
                        if (unlessCondition.getValue()) {
                            appendItems(unlessHideout, unlessElements);
                        } else {
                            unlessComponent.elems = unlessElements.concat(unlessMarker);
                        }
                        result.push(unlessComponent);
                        observe(unlessCondition, remove => {
                            const { parentNode } = unlessMarker;
                            if (!parentNode) {
                                return;
                            }
                            if (remove) {
                                removeItems(parentNode, unlessElements);
                                appendItems(unlessHideout, unlessElements);
                                unlessComponent.elems = [unlessMarker];
                            } else {
                                removeItems(unlessHideout, unlessElements);
                                insertItemsBefore(parentNode, unlessMarker, unlessElements);
                                unlessComponent.elems = unlessElements.concat(unlessMarker);
                            }
                        })
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
                        const listComponent: ControlComponent = {
                            elems: createFlatListElement(params, listAlias, list.getValue(), children),
                            marker: document.createTextNode('')
                        };
                        result.push(listComponent);
                        observe(list, items => {
                            const { elems, marker } = listComponent;
                            const { parentNode } = marker;
                            if (!parentNode) {
                                return;
                            }
                            const newListElements: NodeComponent[] = createFlatListElement(
                                params, listAlias, items, children
                            );
                            removeItems(parentNode, elems);
                            insertItemsBefore(parentNode, marker, newListElements);
                            listComponent.elems = newListElements;
                        });
                    } else if (list instanceof StateList) {
                        const listMarker = document.createTextNode('');
                        const listElementEach = createListElement(params, listAlias, list.toArray(), children);
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
                        result.push(listComponent);
                        list.onUpdate((index, next) => {
                            const { startMarker, endMarker, elems: oldElems } = mirrorList[index];
                            const { parentNode } = endMarker;
                            if (!parentNode) {
                                return;
                            }
                            const newElems = intoDom(children, cloneObjWithValue(params, listAlias, next));
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
                            const newElems = intoDom(children, cloneObjWithValue(params, listAlias, inserted));
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
                    const obj: object | State<object> = params[objKey];
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
                        const destructParams = cloneObjWithAlias(params, propNames, obj.getValue());
                        const destructComponent: ControlComponent = {
                            elems: intoDom(children, destructParams),
                            marker: document.createTextNode('')
                        };
                        result.push(destructComponent);
                        observe(obj, ob => {
                            const { elems, marker } = destructComponent;
                            const { parentNode } = marker;
                            if (!parentNode) {
                                return;
                            }
                            removeItems(parentNode, elems);
                            const destructParams = cloneObjWithAlias(params, propNames, ob);
                            const destructElements = intoDom(children, destructParams)
                            insertItemsBefore(parentNode, marker, destructElements);
                            destructComponent.elems = destructElements;
                        });
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
