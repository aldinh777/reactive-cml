import { StateList, ListViewMapped } from '@aldinh777/reactive/collection';
import { NodeComponent, Context, intoDom, ControlComponent } from '..';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../util';
import { insertBefore, remove, _text } from '../dom-util';
import { readAlias, propAlias } from '../prop-util';

interface MirrorElement {
    elems: NodeComponent[];
    start: Text;
}

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.list !== 'string') {
        return;
    }
    const { slots, params, _super } = context;
    const list = params[props.list];
    const alias = props.as;
    const extracts = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    if (!(list instanceof StateList)) {
        throw ComponentError.invalidCollect('foreach', 'list', props.list);
    }
    const marker = _text('');
    const listElement: ListViewMapped<any, MirrorElement> = new ListViewMapped(list, (item) => {
        const localParams = propAlias(params, extracts, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        return {
            elems: intoDom(slots._children, localParams, _super),
            start: _text('')
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
