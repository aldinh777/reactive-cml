export function isInvalidIdentifier(id: string): RegExpMatchArray | null {
    return id.match(/(^\d|[^\w_$])/);
}

export function undupe<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}
