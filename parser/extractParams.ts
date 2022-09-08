import { CMLObject, CMLTree } from '@aldinh777/cml-parser';
import { extractTextProps, TextProp, undupe } from '../util';
import preprocessComponent from './preprocess/preprocessComponent';
import preprocessChildren from './preprocess/preprocessChildren';
import preprocessControl from './preprocess/preprocessControl';
import preprocessList from './preprocess/preprocessList';
import preprocessDestruct from './preprocess/preprocessDestruct';
import preprocessElement from './preprocess/preprocessElement';

export type Identifiers = [dependencies: string[], params: string[], blacklist?: Set<string>];
type Preprocessor = (node: CMLObject, ids: Identifiers) => CMLObject;

export function isInvalidIdentifier(id: string): RegExpMatchArray | null {
    return id.match(/(^\d|[^\w_$])/);
}

function preprocessCML(
    item: CMLObject,
    ids: Identifiers,
    preprocessors: Preprocessor[]
): CMLObject {
    let processed = item;
    for (let i = 0; i < preprocessors.length; i++) {
        const pre = preprocessors[i];
        processed = pre(processed, ids);
    }
    return processed;
}

export default function extractParams(
    items: CMLTree,
    blacklist: Set<string> = new Set()
): Identifiers {
    let dep: string[] = [];
    let par: string[] = [];
    for (const item of items) {
        if (typeof item === 'string') {
            const params = extractTextProps(item)
                .filter((i) => typeof i !== 'string')
                .map((tp) => (tp as TextProp).name);
            par.push(...params);
        } else {
            const localBlacklist = new Set(blacklist);
            const processedItem = preprocessCML(
                item,
                [dep, par, localBlacklist],
                [
                    preprocessComponent,
                    preprocessChildren,
                    preprocessControl,
                    preprocessList,
                    preprocessDestruct,
                    preprocessElement
                ]
            );
            const { children } = processedItem;
            const [dependencies, params] = extractParams(children, localBlacklist);
            dep = dep.concat(dependencies);
            par = par.concat(params);
        }
    }
    dep = undupe(dep);
    par = undupe(par).filter((param) => !blacklist.has(param));
    return [dep, par];
}
