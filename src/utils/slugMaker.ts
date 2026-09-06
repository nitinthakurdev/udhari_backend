export const toSlug = (value: string): string => {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
};