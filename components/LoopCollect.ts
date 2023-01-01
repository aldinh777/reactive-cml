import { ListViewMapped } from '@aldinh777/reactive/collection/view/ListViewMapped';
import { isList } from '@aldinh777/reactive-utils/validator';
import { NodeComponent, Context, intoDom, ControlComponent } from '../dom';
import { _text, append, remove } from '../dom/dom-util';
import { readAlias, propAlias } from '../dom/prop-util';
import ComponentError from '../error/ComponentError';
import { Properties } from '../util';

interface MirrorElement {
    items: NodeComponent[];
    start: Text;
}

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.list !== 'string') {
        return;
    }
    const { children, params, _super } = context;
    const list = params[props.list];
    const alias = props.as;
    const extracts = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    if (!isList(list)) {
        throw new ComponentError(
            `'${props.list}' are not a valid StateCollection in 'collect:list' property of 'foreach' element`
        );
    }
    const marker = _text('');
    const listElement: ListViewMapped<any, MirrorElement> = new ListViewMapped(list, (item) => {
        const localParams = propAlias(params, extracts, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        return {
            items: intoDom(children, localParams, _super),
            start: _text('')
        };
    });
    const component: ControlComponent = {
        items: listElement.raw.flatMap((m) => (m ? [m.start, ...m.items] : []))
    };
    listElement.onUpdate((_, next, prev: MirrorElement) => {
        const { parentNode } = prev.start;
        if (parentNode) {
            append(parentNode, [next.start, ...next.items], prev.start);
            remove(parentNode, [prev.start, ...prev.items]);
        }
        const startIndex = component.items.indexOf(prev.start);
        if (startIndex !== -1) {
            component.items.splice(startIndex, prev.items.length + 2, next.start, ...next.items);
        }
    });
    listElement.onInsert((index, inserted) => {
        const nextElem = listElement.get(index + 1);
        const nextMarker = nextElem ? nextElem.start : marker;
        const { parentNode } = marker;
        if (parentNode) {
            append(parentNode, [inserted.start, ...inserted.items], nextMarker);
        }
        const startIndex = nextElem ? component.items.indexOf(nextElem.start) : 0;
        component.items.splice(startIndex, 0, inserted.start, ...inserted.items);
    });
    listElement.onDelete((_, deleted) => {
        const { parentNode } = deleted.start;
        if (parentNode) {
            remove(parentNode, [deleted.start, ...deleted.items]);
        }
        const startIndex = component.items.indexOf(deleted.start);
        if (startIndex !== -1) {
            component.items.splice(startIndex, deleted.items.length + 2);
        }
    });
    return [component, marker];
}
