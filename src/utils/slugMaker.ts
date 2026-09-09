export const toSlug = (value: string): string => {
    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
};


export const usernameModifier = (str:string):string => {
    return  str.replace(/[^a-zA-Z0-9]/g, '');
}