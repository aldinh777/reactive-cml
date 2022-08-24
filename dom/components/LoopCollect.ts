import { State } from '@aldinh777/reactive';
import { StateList } from '@aldinh777/reactive/collection';
import {
    ComponentChildren,
    ControlComponent,
    insertItemsBefore,
    intoDom,
    NodeComponent,
    removeItems
} from '..';
import { RCMLResult } from '../../src';
import { Properties } from '../../util';
import { cloneSetVal } from '../dom-util';
import { isReactive } from '../reactive-util';

interface MirrorElement {
    elems: NodeComponent[];
    start: Text;
    end: Text;
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
        const localParams: Properties = cloneSetVal(params, alias, item);
        result.push(intoDom(children, localParams, cc));
    }
    return result;
}

export default function (props: Properties = {}, _children?: ComponentChildren): NodeComponent[] {
    if (!_children || typeof props.list !== 'string' || typeof props.as !== 'string') {
        return [];
    }
    const { tree, params, _super } = _children;
    const list = params[props.list];
    const alias = props.as;
    if (list instanceof StateList) {
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
                const newElems = intoDom(tree, cloneSetVal(params, alias, nextItem), _super);
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
            const newElems = intoDom(tree, cloneSetVal(params, alias, insertedItem), _super);
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
        throw TypeError(`'${props.object}' are not a valid collection state`);
    }
}
