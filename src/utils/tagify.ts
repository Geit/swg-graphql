export const TAGIFY = (input: string) => parseInt(Buffer.from(input).toString('hex'), 16);

export default TAGIFY;
