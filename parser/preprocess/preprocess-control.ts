import { CMLObject } from '@aldinh777/cml-parser';
import CompileError from '../../error/CompileError';
import { Identifiers } from '../extractParams';
import { isInvalidIdentifier } from '../parser-util';

export default function (item: CMLObject, [dep, par]: Identifiers): CMLObject {
    const { tag, props } = item;
    if (tag !== 'if' && tag !== 'unless') {
        return item;
    }
    if (tag === 'unless') {
        props.rev = '';
    }
    if (Reflect.has(props, 'state:val')) {
        const stateName = props['state:val'];
        if (!stateName) {
            throw CompileError.statementRequire('if', 'val');
        }
        if (isInvalidIdentifier(stateName)) {
            throw CompileError.invalidIdentifier(tag, 'property', 'list', stateName);
        }
        delete props['state:val'];
        props.val = stateName;
        item.tag = 'ControlState';
        dep.push('ControlState');
        par.push(stateName);
    } else {
        const valueName = props['val'];
        if (!valueName) {
            throw CompileError.statementRequire('if', 'val');
        }
        if (isInvalidIdentifier(valueName)) {
            throw CompileError.invalidIdentifier(tag, 'property', 'list', valueName);
        }
        item.tag = 'ControlBasic';
        dep.push('ControlBasic');
        par.push(valueName);
    }
    return item;
}
