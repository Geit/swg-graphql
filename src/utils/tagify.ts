export const TAGIFY = (input: string) => parseInt(Buffer.from(input).toString('hex'), 16);

export const STRUCTURE_TYPE_IDS = [TAGIFY('BUIO'), TAGIFY('HINO'), TAGIFY('INSO'), TAGIFY('MINO')];

export default TAGIFY;
