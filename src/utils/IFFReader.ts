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
  typeName: string;
  size: number;
  data: Buffer;
}

type CombinedStackType = ChunkStackType | FormStackType;

const chunkParser = Parser.start().endianess('big').buffer('data', {
  length: 'size',
});

const iffParser = Parser.start()
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
          [TAGIFY('FORM')]: Parser.start()
            .uint32('subType')
            .seek(-4)
            .string('subTypeName', { encoding: 'utf-8', length: 4 })
            .nest('formData', { type: 'formParser' }),
        },
        // Otherwise it's a chunk
        defaultChoice: chunkParser,
      }),
    readUntil(item, buffer) {
      // @ts-expect-error type this later
      if (this.$parent && this.$parent.type === TAGIFY('FORM')) {
        const alreadyReadSize =
          // @ts-expect-error type this later
          this.children?.reduce(
            (acc: number, cur: { size: number; type: number }) =>
              acc + cur.size + (cur.type === TAGIFY('FORM') ? 12 : 8),
            // Start with 4 to account for FORM subtype
            4
          ) ?? 0;

        // @ts-expect-error type this later
        return alreadyReadSize >= this.$parent.size;
      }
      if (buffer.length === 0) return true; // No buffer left to read;

      return false;
    },
  });

export class IffReader {
  parsedData: IffRootType;

  rootStack: FormStackType;

  currentNode: CombinedStackType[] | ChunkStackType;
  stack: (CombinedStackType[] | ChunkStackType)[];

  constructor(data: Buffer) {
    const iffRoot: IffRootType = iffParser.parse(data);

    this.parsedData = iffRoot;

    this.currentNode = this.parsedData.children;
    this.stack = [];
  }

  private static isForm(stack: CombinedStackType): stack is FormStackType {
    return stack.type === TAGIFY('FORM');
  }

  private static isChunk(stack: CombinedStackType): stack is ChunkStackType {
    return stack.type !== TAGIFY('FORM');
  }

  /**
   * Match a tag name, handling 3-char TAG3 names that may be padded with space or null.
   */
  private static matchesName(actual: string, search: string): boolean {
    if (search.length === actual.length) return actual === search;
    if (search.length < 4 && actual.length === 4) {
      const padded = search.padEnd(4, ' ');
      return actual === padded;
    }
    return false;
  }

  getFormNameCount(name: string) {
    if (!Array.isArray(this.currentNode)) throw new Error('A form cannot be a child of a chunk!');

    return this.currentNode.filter(n => IffReader.isForm(n) && IffReader.matchesName(n.subTypeName, name)).length;
  }

  hasForm(name: string) {
    if (!Array.isArray(this.currentNode)) throw new Error('A form cannot be a child of a chunk!');

    return this.currentNode.some(n => IffReader.isForm(n) && IffReader.matchesName(n.subTypeName, name));
  }

  enterForm(name: string, idx = 0) {
    if (!Array.isArray(this.currentNode)) throw new Error('A form cannot be a child of a chunk!');

    const newForm = this.currentNode
      .filter(IffReader.isForm)
      .filter(node => IffReader.matchesName(node.subTypeName, name))
      .at(idx);

    if (!newForm) throw new Error(`No form named ${name} found!`);

    this.stack.push(this.currentNode);
    this.currentNode = newForm.formData.children;
  }

  exitForm() {
    this.currentNode = this.stack.pop()!;
  }

  enterChunk(name: string, idx = 0) {
    if (!Array.isArray(this.currentNode)) throw new Error('Already in a chunk!');

    const newChunk = this.currentNode
      .filter(IffReader.isChunk)
      .filter(node => IffReader.matchesName(node.typeName, name))
      .at(idx);

    if (!newChunk) throw new Error(`No chunk named ${name} found!`);

    this.stack.push(this.currentNode);
    this.currentNode = newChunk;
  }

  exitChunk() {
    this.currentNode = this.stack.pop()!;
  }

  getChunkData(): Buffer {
    if (Array.isArray(this.currentNode)) throw new Error('Not currently in a chunk!');

    return this.currentNode.data;
  }
}
