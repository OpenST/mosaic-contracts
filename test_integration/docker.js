const childProcess = require('child_process');
const path = require('path');
const waitPort = require('wait-port');

const composeFilePath = path.join(__dirname, './docker-compose.yml');

const asyncSleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const dockerSetup = () => {
  const dockerCompose = childProcess.spawn('docker-compose', ['-f', composeFilePath, 'up', '--force-recreate']);

  if (process.env.TEST_STDOUT) {
    dockerCompose.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    dockerCompose.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  }

  const originPort = 8546;
  const auxiliaryPort = 8547;

  const waitForOriginNode = waitPort({ port: originPort, output: 'silent' });
  const waitForAuxiliaryNode = waitPort({ port: auxiliaryPort, output: 'silent' });
  return Promise.all([waitForOriginNode, waitForAuxiliaryNode]).then(() => {
    // even after the ports are available the nodes need a bit of time to get online
    return asyncSleep(5000);
  }).then(() => ({
    rpcEndpointOrigin: `http://localhost:${originPort}`,
    rpcEndpointAuxiliary: `http://localhost:${auxiliaryPort}`,
  }));
};

const dockerTeardown = () => {
  const dockerComposeDown = childProcess.spawnSync('docker-compose', ['-f', composeFilePath, 'down']);
  if (process.env.TEST_STDOUT) {
    process.stdout.write(dockerComposeDown.stdout);
    process.stderr.write(dockerComposeDown.stderr);
  }
};

module.exports = {
  asyncSleep,
  dockerSetup,
  dockerTeardown
};
