import { ListViewMapped } from '@aldinh777/reactive/collection/view/ListViewMapped';
import { StateList } from '@aldinh777/reactive/collection/StateList';
import { ComponentChildren, ControlComponent, intoDom, NodeComponent } from '..';
import { Properties } from '../../util';
import { remove, insertBefore } from '../dom-util';
import { propAlias, readAlias } from '../prop-util';
import ComponentError from '../../error/ComponentError';

interface MirrorElement {
    elems: NodeComponent[];
    start: Text;
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
    if (!(list instanceof StateList)) {
        throw ComponentError.invalidCollect('LoopCollect', 'foreach', 'list', props.list);
    }
    const marker = document.createTextNode('');
    const listElement: ListViewMapped<any, MirrorElement> = new ListViewMapped(list, (item) => {
        const localParams = propAlias(params, destruct, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        return {
            elems: intoDom(tree, localParams, _super),
            start: document.createTextNode('')
        };
    });
    const component: ControlComponent = {
        elems: listElement.raw.flatMap((m) => (m ? [m.start, ...m.elems] : []))
    };
    listElement.onUpdate((_, next, prev: MirrorElement) => {
        const { parentNode } = prev.start;
        if (parentNode) {
            insertBefore(parentNode, [next.start, ...next.elems], prev.start);
            remove(parentNode, [prev.start, ...prev.elems]);
        }
        const startIndex = component.elems.indexOf(prev.start);
        if (startIndex !== -1) {
            component.elems.splice(startIndex, prev.elems.length + 2, next.start, ...next.elems);
        }
    });
    listElement.onInsert((index, inserted) => {
        const nextElem = listElement.get(index + 1);
        const nextMarker = nextElem ? nextElem.start : marker;
        const { parentNode } = marker;
        if (parentNode) {
            insertBefore(parentNode, [inserted.start, ...inserted.elems], nextMarker);
        }
        const startIndex = nextElem ? component.elems.indexOf(nextElem.start) : 0;
        component.elems.splice(startIndex, 0, inserted.start, ...inserted.elems);
    });
    listElement.onDelete((_, deleted) => {
        const { parentNode } = deleted.start;
        if (parentNode) {
            remove(parentNode, [deleted.start, ...deleted.elems]);
        }
        const startIndex = component.elems.indexOf(deleted.start);
        if (startIndex !== -1) {
            component.elems.splice(startIndex, deleted.elems.length + 2);
        }
    });
    return [component, marker];
}
