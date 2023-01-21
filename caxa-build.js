(async () => {
  const { default: caxa } = await import('caxa');
  console.log(`Building distributable package with Caxa...`);

  await caxa({
    input: '.',
    exclude: ['dist', '.git'],
    output: 'dist/swg-graphql',
    command: [
      'env',
      'TS_NODE_BASEURL={{caxa}}/build',
      'TS_NODE_PROJECT={{caxa}}',
      '{{caxa}}/node_modules/.bin/node',
      '-r',
      '{{caxa}}/node_modules/tsconfig-paths/register',
      '{{caxa}}/build/index.js',
    ],
  });
})();
