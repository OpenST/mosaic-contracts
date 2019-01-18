const childProcess = require('child_process');
const path = require('path');
const waitPort = require('wait-port');

const composeFilePath = path.join(__dirname, './docker-compose.yml');

const asyncSleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const dockerNodesSetup = () => {
    const dockerCompose = childProcess.spawn('docker-compose', ['-f', composeFilePath, 'up', '--force-recreate']);

    if (process.env.TEST_STDOUT) {
        dockerCompose.stdout.on('data', (data) => {
            process.stdout.write(data);
        });
        dockerCompose.stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    }

    const waitForOriginNode = waitPort({ port: 8546, output: 'silent' });
    const waitForAuxiliaryNode = waitPort({ port: 8547, output: 'silent' });
    return Promise.all([waitForOriginNode, waitForAuxiliaryNode]).then(() => {
        // even after the ports are available the nodes need a bit of time to get online
        return asyncSleep(5000);
    });
};

const dockerNodesTeardown = () => {
    const dockerComposeDown = childProcess.spawnSync('docker-compose', ['-f', composeFilePath, 'down']);
    if (process.env.TEST_STDOUT) {
        process.stdout.write(dockerComposeDown.stdout);
        process.stderr.write(dockerComposeDown.stderr);
    }
};

module.exports = {
    asyncSleep,
    dockerNodesSetup,
    dockerNodesTeardown,
};
