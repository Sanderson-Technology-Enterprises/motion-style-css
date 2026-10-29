import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { publint } from 'publint';

/** Run npm through the same CLI that invoked this package script, without a shell. */
function npm(args, cwd = process.cwd()) {
  if (!process.env.npm_execpath)
    throw new Error('Run this check through npm run package:check');
  return execFileSync(process.execPath, [process.env.npm_execpath, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

/** Build an actual tarball, enforce its allowlist, and import it from a clean consumer. */
async function checkPackage() {
  const result = await publint({ pkgDir: process.cwd() });
  assert.deepEqual(
    result.messages,
    [],
    'publint must report no package errors or warnings',
  );
  const base = resolve('.tmp/package-proof');
  await mkdir(base, { recursive: true });
  const [packed] = JSON.parse(
    npm(['pack', '--json', '--ignore-scripts', '--pack-destination', base]),
  );
  const required = [
    'src/index.js',
    'src/index.d.ts',
    'src/motion.css',
    'README.md',
    'LICENSE',
    'CHANGELOG.md',
    'docs/INTEGRATION.md',
  ];
  const files = packed.files.map((file) => file.path);
  for (const file of required)
    assert.ok(files.includes(file), `Missing tarball file: ${file}`);
  for (const file of files)
    assert.match(
      file,
      /^(src\/|docs\/api\/|docs\/INTEGRATION\.md$|README\.md$|LICENSE$|CHANGELOG\.md$|package\.json$)/,
      `Unexpected tarball file: ${file}`,
    );
  const consumer = resolve(base, `consumer-${Date.now()}`);
  await mkdir(consumer);
  await writeFile(
    resolve(consumer, 'package.json'),
    '{"private":true,"type":"module"}\n',
  );
  npm(
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--offline',
      resolve(base, packed.filename),
    ],
    consumer,
  );
  const modulePath = resolve(consumer, 'probe.mjs');
  await writeFile(
    modulePath,
    `import assert from 'node:assert/strict';\nimport {presets, enter, exit, cancel, stagger, replace, animate} from '@sanderson-technology-enterprises/motion-style-css';\nassert.equal(presets.length,10);\nfor(const api of [enter,exit,cancel,stagger,replace,animate]) assert.equal(typeof api,'function');\nassert.ok(import.meta.resolve('@sanderson-technology-enterprises/motion-style-css/styles.css').endsWith('/src/motion.css'));\nconsole.log('Clean consumer import and CSS export passed');\n`,
  );
  console.log(
    execFileSync(process.execPath, [modulePath], {
      cwd: consumer,
      encoding: 'utf8',
    }).trim(),
  );
  await writeFile(
    resolve(consumer, 'consumer.ts'),
    await readFile('tests/types/consumer.ts'),
  );
  await writeFile(
    resolve(consumer, 'tsconfig.json'),
    await readFile('tests/types/tsconfig.json'),
  );
  execFileSync(
    process.execPath,
    [
      resolve('node_modules/typescript/bin/tsc'),
      '--project',
      resolve(consumer, 'tsconfig.json'),
    ],
    { cwd: consumer, stdio: 'pipe' },
  );
  console.log('Clean consumer TypeScript declarations passed');
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(packed.name, manifest.name);
  assert.equal(packed.version, manifest.version);
  await writeFile(
    resolve(base, 'proof.json'),
    JSON.stringify(
      {
        name: packed.name,
        version: packed.version,
        filename: packed.filename,
        integrity: packed.integrity,
        shasum: packed.shasum,
        files,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Verified ${packed.name}@${packed.version}: ${files.length} allowed files, ${packed.unpackedSize} unpacked bytes`,
  );
}

await checkPackage();
