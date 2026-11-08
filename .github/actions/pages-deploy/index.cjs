/* global console, fetch, process, setTimeout */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function githubRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2026-03-10',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new Error(
      `GitHub request failed: ${response.status} ${response.statusText} ${typeof data === 'string' ? data : JSON.stringify(data)}`,
    );
  }

  return data;
}

async function main() {
  const required = [
    'ACTIONS_RUNTIME_TOKEN',
    'ACTIONS_RESULTS_URL',
    'ACTIONS_ID_TOKEN_REQUEST_TOKEN',
    'ACTIONS_ID_TOKEN_REQUEST_URL',
    'RUNNER_TEMP',
    'GITHUB_REPOSITORY',
    'GITHUB_SHA',
    'GH_TOKEN',
  ];

  for (const name of required) {
    if (!process.env[name]) {
      throw new Error(`Required Actions runtime variable is unavailable: ${name}`);
    }
  }

  const temp = process.env.RUNNER_TEMP;
  const uploaderDir = path.join(temp, 'motion-pages-uploader');
  fs.mkdirSync(uploaderDir, { recursive: true });

  execFileSync('npm', ['init', '-y'], {
    cwd: uploaderDir,
    stdio: 'ignore',
  });
  execFileSync(
    'npm',
    [
      'install',
      '--no-audit',
      '--no-fund',
      '--silent',
      '@actions/artifact@2.3.2',
    ],
    {
      cwd: uploaderDir,
      stdio: 'inherit',
    },
  );

  const { DefaultArtifactClient } = require(
    path.join(uploaderDir, 'node_modules', '@actions', 'artifact'),
  );
  const artifact = new DefaultArtifactClient();
  const tarPath = path.join(temp, 'artifact.tar');

  const upload = await artifact.uploadArtifact(
    'github-pages',
    [tarPath],
    temp,
    { retentionDays: 1 },
  );

  if (!upload?.id) {
    throw new Error('Pages artifact upload returned no artifact ID.');
  }

  console.log(`Uploaded github-pages artifact ID ${upload.id}`);

  const oidcResponse = await fetch(process.env.ACTIONS_ID_TOKEN_REQUEST_URL, {
    headers: {
      Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`,
    },
  });

  if (!oidcResponse.ok) {
    throw new Error(
      `OIDC token request failed: ${oidcResponse.status} ${oidcResponse.statusText}`,
    );
  }

  const oidc = await oidcResponse.json();
  if (!oidc?.value) {
    throw new Error('OIDC token response contained no token.');
  }

  const apiBase = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`;
  const deployment = await githubRequest(`${apiBase}/pages/deployments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      artifact_id: upload.id,
      pages_build_version: process.env.GITHUB_SHA,
      oidc_token: oidc.value,
      environment: 'github-pages',
    }),
  });

  const deploymentId =
    deployment?.id ||
    String(deployment?.status_url || '')
      .split('/')
      .filter(Boolean)
      .pop();

  if (!deploymentId) {
    throw new Error(
      `Pages deployment returned no deployment ID: ${JSON.stringify(deployment)}`,
    );
  }

  console.log(`Created Pages deployment ${deploymentId}`);

  for (let attempt = 1; attempt <= 120; attempt += 1) {
    const status = await githubRequest(
      `${apiBase}/pages/deployments/${deploymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GH_TOKEN}`,
        },
      },
    );

    console.log(`Pages deployment status: ${status?.status}`);

    if (status?.status === 'succeed') {
      break;
    }

    if (
      [
        'deployment_failed',
        'deployment_perms_error',
        'deployment_content_failed',
        'deployment_cancelled',
        'deployment_lost',
      ].includes(status?.status)
    ) {
      throw new Error(
        `Pages deployment failed with status ${status.status}: ${JSON.stringify(status)}`,
      );
    }

    if (attempt === 120) {
      throw new Error('Pages deployment did not complete within 10 minutes.');
    }

    await sleep(5000);
  }

  const publicUrl =
    'https://sanderson-technology-enterprises.github.io/motion-style-css/';

  for (let attempt = 1; attempt <= 36; attempt += 1) {
    const response = await fetch(
      `${publicUrl}?verify=${process.env.GITHUB_SHA}-${attempt}`,
      { redirect: 'follow' },
    );
    const html = await response.text();

    if (
      response.ok &&
      html.includes('v1.1.0') &&
      /seventeen/i.test(html)
    ) {
      console.log('Public Motion Studio is serving v1.1.0.');
      return;
    }

    await sleep(5000);
  }

  throw new Error(
    'Pages deployment succeeded, but public verification did not observe v1.1.0.',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
