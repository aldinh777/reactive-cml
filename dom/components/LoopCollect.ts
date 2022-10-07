import { StateCollection } from '@aldinh777/reactive/collection/StateCollection';
import { ComponentChildren, ControlComponent, intoDom, NodeComponent } from '..';
import { RCMLResult } from '../../src';
import { Properties } from '../../util';
import { remove, insertBefore } from '../dom-util';
import { propAlias, PropAlias, readAlias } from '../prop-util';
import ComponentError from '../../error/ComponentError';

interface MirrorElement {
    elems: NodeComponent[];
    start: Text;
    end: Text;
}

function createListElement(
    params: Properties,
    alias: string,
    destruct: PropAlias[],
    items: any[],
    children: RCMLResult[],
    cc?: ComponentChildren
): NodeComponent[][] {
    const result: NodeComponent[][] = [];
    for (const item of items) {
        const localParams = propAlias(params, destruct, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        result.push(intoDom(children, localParams, cc));
    }
    return result;
}

function acquireDom(
    params: Properties,
    item: any,
    mapper: WeakMap<object, Node>,
    children: RCMLResult[],
    cc?: ComponentChildren
): NodeComponent[] {
    if (typeof item === 'object' && mapper.has(item)) {
        return [mapper.get(item)] as Node[];
    }
    return intoDom(children, params, cc);
}

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.list !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    const list = params[props.list];
    const alias = props.as;
    const destruct = typeof props.destruct === 'string' ? readAlias(props.destruct) : [];
    if (!(list instanceof StateCollection && list.raw instanceof Array)) {
        throw ComponentError.invalidCollect('LoopCollect', 'foreach', 'list', props.list);
    }
    const marker = document.createTextNode('');
    const listElementEach = createListElement(params, alias, destruct, list.raw, tree, _super);
    const mirrorList: (MirrorElement | undefined)[] = listElementEach.map((elems) => ({
        elems: elems,
        start: document.createTextNode(''),
        end: document.createTextNode('')
    }));
    const component: ControlComponent = {
        elems: mirrorList.flatMap((m) => (m ? [m.start, ...m.elems, m.end] : []))
    };
    const domMapper: WeakMap<object, Node> = new WeakMap();
    list.onUpdate((index, next) => {
        const mirronElement = mirrorList[index];
        const localParams = propAlias(params, destruct, next);
        if (alias) {
            Object.assign(localParams, { [alias]: next });
        }
        const newElems = acquireDom(localParams, next, domMapper, tree, _super);
        if (mirronElement) {
            const { elems, start: startMarker, end: endMarker } = mirronElement;
            const { parentNode } = endMarker;
            if (!parentNode) {
                return;
            }
            remove(parentNode, elems);
            insertBefore(parentNode, newElems, endMarker);
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
                    insertBefore(parentNode, flatElems, marker);
                }
            } else {
                let i = index + 1;
                while (i < mirrorList.length) {
                    const mirror = mirrorList[i];
                    if (mirror) {
                        const { start: startMarker } = mirror;
                        const { parentNode } = startMarker;
                        if (parentNode) {
                            insertBefore(parentNode, flatElems, startMarker);
                        }
                        break;
                    }
                    i++;
                }
                if (i === mirrorList.length) {
                    const { parentNode } = marker;
                    if (parentNode) {
                        insertBefore(parentNode, flatElems, marker);
                    }
                }
            }
        }
    });
    list.onDelete((index) => {
        const mirrorElement = mirrorList[index];
        if (mirrorElement) {
            const { start, end, elems } = mirrorElement;
            const { parentNode } = end;
            if (!parentNode) {
                return;
            }
            remove(parentNode, [start, ...elems, end]);
            const elementIndex = component.elems.indexOf(start);
            component.elems.splice(elementIndex, elems.length + 2);
        }
        mirrorList.splice(index, 1);
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
        const startMarker = document.createTextNode('');
        const endMarker = document.createTextNode('');
        const localParams = propAlias(params, destruct, inserted);
        if (alias) {
            Object.assign(localParams, { [alias]: inserted });
        }
        const newElems = acquireDom(localParams, inserted, domMapper, tree, _super);
        const mirror: MirrorElement = {
            elems: newElems,
            start: startMarker,
            end: endMarker
        };
        const flatNewElems = [startMarker, ...newElems, endMarker];
        insertBefore(parentNode, flatNewElems, nextMarker);
        if (nextMarker === marker) {
            mirrorList.push(mirror);
            component.elems.push(...flatNewElems);
        } else {
            mirrorList.splice(index, 0, mirror);
            const elementIndex = component.elems.indexOf(nextMarker);
            component.elems.splice(elementIndex, 0, ...flatNewElems);
        }
    });
    return [component, marker];
}
