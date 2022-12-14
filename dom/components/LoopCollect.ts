import { ListViewMapped } from '@aldinh777/reactive/collection/view/ListViewMapped';
import { isList } from '@aldinh777/reactive-utils/validator';
import { NodeComponent, Context, intoDom, ControlComponent } from '..';
import { _text, append, remove, mount, dismount } from '../dom-util';
import { readAlias, propAlias } from '../prop-util';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../util-type';

interface MirrorElement {
    items: NodeComponent[];
    start: Text;
}

export default function (props: Properties = {}, component: Context = {}): NodeComponent[] | void {
    if (typeof props.list !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const list = params[props.list];
    const alias = props.as;
    const extracts = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    if (!isList(list)) {
        throw new ComponentError(
            `'${props.list}' are not a valid StateCollection in 'collect:list' property of 'foreach' element`
        );
    }
    let isMounted = false;
    const marker = _text('');
    const listMirror: ListViewMapped<any, MirrorElement> = new ListViewMapped(list, (item) => {
        const localParams = propAlias(params, extracts, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        return {
            items: intoDom(children, localParams, _super),
            start: _text('')
        };
    });
    const mappedElement: ListViewMapped<MirrorElement, NodeComponent> = new ListViewMapped(
        listMirror,
        (mirror) => ({ items: mirror ? [mirror.start, ...mirror.items] : [] })
    );
    const result: ControlComponent = {
        items: mappedElement.raw,
        mount: () => (isMounted = true),
        dismount: () => (isMounted = false)
    };
    listMirror.onUpdate((_, next, prev: MirrorElement) => {
        const { parentNode } = prev.start;
        if (parentNode) {
            if (isMounted) {
                mount(parentNode, [next.start, ...next.items], prev.start);
                dismount(parentNode, [prev.start, ...prev.items]);
            } else {
                append(parentNode, [next.start, ...next.items], prev.start);
                remove(parentNode, [prev.start, ...prev.items]);
            }
        }
    });
    listMirror.onInsert((index, inserted) => {
        const nextElem = listMirror.get(index + 1);
        const nextMarker = nextElem ? nextElem.start : marker;
        const { parentNode } = marker;
        if (parentNode) {
            if (isMounted) {
                mount(parentNode, [inserted.start, ...inserted.items], nextMarker);
            } else {
                append(parentNode, [inserted.start, ...inserted.items], nextMarker);
            }
        }
    });
    listMirror.onDelete((_, deleted) => {
        const { parentNode } = deleted.start;
        if (parentNode) {
            if (isMounted) {
                dismount(parentNode, [deleted.start, ...deleted.items]);
            } else {
                remove(parentNode, [deleted.start, ...deleted.items]);
            }
        }
    });
    return [result, marker];
}
