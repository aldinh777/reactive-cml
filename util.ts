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
    ): void;
    relativeBlacklist: string[];
    preprocessors: TreePreprocessor[];
}

export type TextProp = [name: string];
export type ImportFormat = [from: string, imports: string | string[]];

export type Identifiers = [dependencies: string[], params: string[], blacklist?: Set<string>];
export type RootPreprocessor = () => void;
export type TreePreprocessor = (node: CMLObject, ids: Identifiers, isRoot: boolean) => CMLObject;

export function isInvalidIdentifier(id: string): RegExpMatchArray | null {
    return id.match(/(^\d|[^\w_$])/);
}

export function extractTextProps(text: string): (string | TextProp)[] {
    const extractedResult: (string | TextProp)[] = [];
    let streamPropertyName = '';
    let propertyName = '';
    let isInProperty = false;
    let isInPropertyName = false;
    let isCheckingWhitespace = false;
    for (let streamIndex = 0; streamIndex < text.length; streamIndex++) {
        const currentCharacter = text[streamIndex];
        if (!isInProperty) {
            if (currentCharacter === '\\' && text[streamIndex + 1] === '{') {
                streamPropertyName += '{';
                streamIndex++;
            } else if (currentCharacter === '{') {
                isInProperty = true;
                isCheckingWhitespace = true;
            } else {
                streamPropertyName += currentCharacter;
            }
            continue;
        }
        if (isCheckingWhitespace) {
            if (currentCharacter === '{') {
                streamPropertyName += '{' + propertyName;
                propertyName = '';
            } else if (currentCharacter === '}') {
                isInProperty = false;
                isCheckingWhitespace = false;
                streamPropertyName += '{' + propertyName + '}';
            } else if (currentCharacter.match(/[^\s]/)) {
                isCheckingWhitespace = false;
                isInPropertyName = true;
                propertyName += currentCharacter;
            } else {
                propertyName += currentCharacter;
            }
        } else if (isInPropertyName) {
            if (currentCharacter === '{') {
                const isBackslash = text[streamIndex - 1] === '\\';
                isInPropertyName = false;
                isCheckingWhitespace = !isBackslash;
                isInProperty = !isBackslash;
                streamPropertyName +=
                    '{' +
                    (isBackslash
                        ? propertyName.slice(0, propertyName.length - 1) + '{'
                        : propertyName);
                propertyName = '';
            } else if (currentCharacter === '}' && propertyName.match(/^\s*[_$A-Za-z][_$\w]*/)) {
                isInProperty = false;
                extractedResult.push(streamPropertyName, [propertyName.trim()]);
                streamPropertyName = '';
                propertyName = '';
            } else if (currentCharacter.match(/\s/)) {
                isInPropertyName = false;
                propertyName += currentCharacter;
            } else if (currentCharacter.match(/[_$\w]/)) {
                propertyName += currentCharacter;
            } else {
                isInPropertyName = false;
                isInProperty = false;
                streamPropertyName += '{' + propertyName + currentCharacter;
                propertyName = '';
            }
        } else {
            if (currentCharacter === '}' && propertyName.match(/^\s*[_$A-Za-z][_$\w]*/)) {
                isInProperty = false;
                extractedResult.push(streamPropertyName, [propertyName.trim()]);
                streamPropertyName = '';
                propertyName = '';
            } else if (currentCharacter.match(/\s/)) {
                propertyName += currentCharacter;
            } else {
                isInProperty = false;
                streamPropertyName += '{' + propertyName + currentCharacter;
                propertyName = '';
            }
        }
    }
    if (isInProperty) {
        streamPropertyName += '{' + propertyName;
    }
    if (streamPropertyName) {
        extractedResult.push(streamPropertyName);
    }
    return extractedResult;
}
