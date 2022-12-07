import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (!context || typeof props.value !== 'string') {
        return;
    }
    const { children, params, _super } = context;
    const unless = Reflect.has(props, 'rev');
    const hasEqual = Reflect.has(props, 'equal');
    const value = params[props.value];
    if (hasEqual) {
        const condition = unless ? value != props.equal : value == props.equal;
        if (condition) {
            return intoDom(children, params, _super);
        }
    } else {
        const condition = unless ? !value : value;
        if (condition) {
            return intoDom(children, params, _super);
        }
    }
}
