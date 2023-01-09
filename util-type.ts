import { CMLObject, CMLTree } from '@aldinh777/cml-parser';

export type Properties = StaticProperties<any>;

export interface StaticProperties<T> {
    [key: string]: T;
}

export interface Preprocessor {
    buildScript(
        cmlRoot: CMLTree,
        identifiers: Identifiers,
        addImport: (item: ImportFormat) => any
    ): string;
    relativeBlacklist?: string[];
    preprocessors?: TreePreprocessor[];
}

export type TextProp = [name: string];
export type ImportFormat = [from: string, imports: string | string[]];

export type Identifiers = [dependencies: string[], params: string[], blacklist?: Set<string>];
export type RootPreprocessor = () => void;
export type TreePreprocessor = (node: CMLObject, ids: Identifiers, isRoot: boolean) => CMLObject;
