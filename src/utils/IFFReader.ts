import { Parser } from 'binary-parser';

import TAGIFY from './tagify';

interface IffRootType {
  children: CombinedStackType[];
}

interface FormStackType {
  type: 1179603533;
  typeName: 'FORM';
  size: number;
  subType: number;
  subTypeName: string;
  formData: {
    children: CombinedStackType[];
  };
}

interface ChunkStackType {
  type: number;
  typeName: 'COLS';
  size: number;
  data: Buffer;
}

type CombinedStackType = ChunkStackType | FormStackType;

const iffParser = new Parser()
  .namely('formParser') //ree
  .useContextVars()
  .array('children', {
    type: new Parser()
      .uint32('type')
      .seek(-4)
      .string('typeName', { length: 4, encoding: 'utf-8' })
      .uint32('size')
      .choice('', {
        tag: 'type',
        choices: {
          [TAGIFY('FORM')]: new Parser()
            .uint32('subType')
            .seek(-4)
            .string('subTypeName', { encoding: 'utf-8', length: 4 })
            .nest('formData', { type: 'formParser' }),
        },
        // Otherwise it's a chunk
        defaultChoice: Parser.start().endianess('big').buffer('data', {
          length: 'size',
        }),
      }),
    readUntil: 'eof',
  });

export class IffReader {
  parsedData: IffRootType;

  rootStack: FormStackType;

  currentStack: CombinedStackType[] | ChunkStackType;
  previousStack: CombinedStackType[] | ChunkStackType;

  constructor(data: Buffer) {
    const iffRoot: IffRootType = iffParser.parse(data);

    this.parsedData = iffRoot;

    this.currentStack = this.parsedData.children;
  }

  private static isForm(stack: CombinedStackType): stack is FormStackType {
    return stack.type === TAGIFY('FORM');
  }

  private static isChunk(stack: CombinedStackType): stack is ChunkStackType {
    return stack.type !== TAGIFY('FORM');
  }

  enterForm(name: string) {
    const previousStack = this.currentStack;

    if (!Array.isArray(this.currentStack)) throw new Error('A form cannot be a child of a chunk!');

    const newForm = this.currentStack.filter(IffReader.isForm).find(node => node.subTypeName === name);

    if (!newForm) throw new Error(`No form named ${name} found!`);

    this.currentStack = newForm.formData.children;
    this.previousStack = previousStack;
  }

  exitForm() {
    this.currentStack = this.previousStack;
  }

  enterChunk(name: string) {
    const previousStack = this.currentStack;

    if (!Array.isArray(this.currentStack)) throw new Error('Already in a chunk!');

    const newChunk = this.currentStack.filter(IffReader.isChunk).find(node => node.typeName === name);

    if (!newChunk) throw new Error(`No chunk named ${name} found!`);

    this.currentStack = newChunk;
    this.previousStack = previousStack;
  }

  exitChunk() {
    this.currentStack = this.previousStack;
  }

  getChunkData(): Buffer {
    if (Array.isArray(this.currentStack)) throw new Error('Not currently in a chunk!');

    return this.currentStack.data;
  }
}
