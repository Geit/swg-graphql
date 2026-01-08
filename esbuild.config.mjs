import { build as esbuild } from 'esbuild';
import { esbuildDecorators } from '@anatine/esbuild-decorators';
import { glob } from 'glob';

async function runBuild() {
  console.log('Finding entry points...');
  const entryPoints = await glob('src/**/*.ts', { ignore: 'src/**/node_modules/**' });
  console.log(`Found ${entryPoints.length} files to compile.`);

  await esbuild({
    entryPoints,
    outdir: 'build',
    outbase: 'src',
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    bundle: false,
    sourcemap: true,
    plugins: [
      esbuildDecorators({
        tsconfigPath: './tsconfig.json',
      }),
    ],
  });
  console.log('Build complete!');
}

runBuild().catch(err => {
  console.error(err);
  process.exit(1);
});
