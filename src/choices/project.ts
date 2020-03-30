/* eslint-disable no-console */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import execa from 'execa';
import Listr from 'listr';
import rm from 'rimraf';
import mkdirp from 'mkdirp';

function generateCore(
  type: string | undefined,
  projectName: string,
  targetLocation: string,
  packageManager: string | undefined,
  skipInstall: string | undefined,
): void {
  const targetDir = join(targetLocation, projectName);

  const tasks: any = [];

  if (!existsSync(targetDir)) {
    tasks.push({
      title: 'Setting up your project',
      task: (): Listr<any> => {
        return new Listr(
          [
            {
              title: 'Downloading template',
              task: (): execa.ExecaChildProcess<string> =>
                execa('git', [
                  'clone',
                  `https://github.com/WekanCompany/leapjs-typescript-starter.git`,
                  targetDir,
                  '-b',
                  type === 'queues' ? 'queues-with-rmq' : 'baseline',
                ]),
            },
            {
              title: 'Setting up git',
              task: async (): Promise<void> => {
                try {
                  rm.sync(`${resolve(join(targetDir, '.git'))}`);
                  mkdirp.sync(join(targetDir, '/storage/logs'));
                  const pjsPath = join(targetDir, 'package1.json');
                  const data = readFileSync(pjsPath, 'utf8');
                  const result = data.replace(
                    /leapjs-typescript-starter/g,
                    projectName,
                  );
                  writeFileSync(pjsPath, result, 'utf8');
                  await execa('gita', ['init'], { cwd: targetDir });
                } catch (error) {
                  console.log(error.message);
                  process.exit(1);
                }
              },
            },
          ],
          // collapse isn't included in the definitions
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          { concurrent: false, collapse: false },
        );
      },
    });
  } else {
    console.log(chalk.red('Destination already exists'));
    process.exit(0);
  }

  if (skipInstall === undefined) {
    if (packageManager && packageManager.toLowerCase() === 'yarn') {
      tasks.push({
        title: 'Install package dependencies with yarn',
        task: () =>
          execa('yarn', { cwd: targetDir }).catch(() => {
            console.log(
              chalk.red('Yarn not found. Make sure yarn is installed globally'),
            );
            process.exit(0);
          }),
      });
    } else {
      tasks.push({
        title: 'Install package dependencies with npm',
        task: (): Promise<execa.ExecaReturnValue<string>> =>
          execa('npm', ['install'], { cwd: targetDir }).catch(() => {
            console.log(
              chalk.red('Npm not found. Make sure npm is installed globally'),
            );
            process.exit(0);
          }),
      });
    }
  }

  new Listr(tasks, {}).run().catch((err: any) => {
    console.error(err);
  });
}

export default generateCore;
