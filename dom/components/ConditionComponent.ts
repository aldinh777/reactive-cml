import { State } from '@aldinh777/reactive';
import { Properties } from '../../util';
import {
    appendItems,
    ComponentChildren,
    ControlComponent,
    insertItemsBefore,
    intoDom,
    NodeComponent,
    removeItems
} from '..';

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] {
    if (!_children || typeof props.condition !== 'string') {
        return [];
    }
    const { tree, params, _super } = _children;
    const unless = props.reverse;
    const condkey = props.condition;
    let condition = _children.params[condkey];
    if (condition instanceof State) {
        if (unless) {
            const rev = new State(!condition.getValue());
            condition.onChange((un) => rev.setValue(!un));
            condition = rev;
        }
        const hide = document.createElement('div');
        const marker = document.createTextNode('');
        const elements = intoDom(tree, params, _super);
        const component: ControlComponent = { elems: [] };
        if (condition.getValue()) {
            component.elems = elements;
        } else {
            appendItems(hide, elements);
        }
        condition.onChange((append: boolean) => {
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
        return [component, marker];
    } else {
        if (unless) {
            condition = !condition;
        }
        if (condition) {
            return intoDom(tree, params, _super);
        }
        return [];
    }
}
