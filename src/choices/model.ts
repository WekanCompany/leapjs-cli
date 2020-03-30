/* eslint-disable no-console */
import fs, { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import shell from 'shelljs';
import mkdirp from 'mkdirp';
import execa from 'execa';
import Listr from 'listr';
import { plural } from 'pluralize';
import { CliModelOptions } from '../interfaces';
import render from '../util';

let targetDir = process.cwd();

let options: CliModelOptions = {
  modelName: '',
  templatePath: '',
};

const skipFiles = ['node_modules'];

function toPascalCase(str: string): string {
  return `${str}`
    .replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w+)/, 'g'),
      ($1, $2, $3) => `${$2.toUpperCase()}${$3.toLowerCase()}`,
    )
    .replace(new RegExp(/\s/, 'g'), '')
    .replace(new RegExp(/\w/), (s) => s.toUpperCase());
}

function createModelFromTemplate(templatePath: string, path: string): boolean {
  try {
    const filesToCreate = fs.readdirSync(templatePath);
    const filePath = path.toLowerCase();
    const { modelName } = options;

    filesToCreate.forEach((file) => {
      const origFilePath = join(templatePath, file);
      const stats = fs.statSync(origFilePath);

      if (skipFiles.indexOf(file) > -1) {
        return;
      }

      if (stats.isFile()) {
        let contents = fs.readFileSync(origFilePath, 'utf8');

        const modelNameLower = modelName.toLowerCase();

        contents = render(contents, {
          modelName,
          modelNameLower,
          modelNamePlural: plural(modelName),
          modelNameLowerPlural: plural(modelNameLower),
        });

        const writePath = join(
          targetDir,
          path,
          `${options.modelName.toLowerCase()}.ts`,
        );
        if (!fs.existsSync(writePath)) {
          fs.writeFileSync(writePath, contents, 'utf8');
          console.log(
            `\t${chalk.greenBright('CREATED')} ${chalk.whiteBright(writePath)}`,
          );
        }
      } else if (stats.isDirectory()) {
        const tmpFile = file.toLowerCase();
        if (file === 'model') {
          // eslint-disable-next-line no-param-reassign
          file = modelName.toLowerCase();
        }

        const dir = join(targetDir, filePath, file);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // recursive call
        createModelFromTemplate(
          join(templatePath, tmpFile),
          join(filePath, file),
        );
      }
    });
    return true;
  } catch (error) {
    console.log('');
    console.log(error.message);
    return false;
  }
}

function generateModel(
  type: string,
  modelName: string,
  targetLocation: string,
): void {
  const tmpDir = `${shell.tempdir()}/.framework-templates/nodejs/models`;

  targetDir = targetLocation;
  const templatePath = join(tmpDir, type);

  options = {
    modelName: toPascalCase(modelName),
    templatePath,
  };

  if (existsSync(join(targetDir, '/src/app', modelName))) {
    console.log(
      chalk.red('Destination already contains a module with the same name'),
    );
    process.exit();
  }

  mkdirp.sync(targetDir);

  const tasks: any = [];

  if (!existsSync(tmpDir)) {
    tasks.push({
      title: 'Setting up the module',
      task: (): Listr<any> => {
        return new Listr(
          [
            {
              title: 'Downloading templates',
              task: (): execa.ExecaChildProcess<string> =>
                execa('git', [
                  'clone',
                  `https://github.com/WekanCompany/leapjs-typescript-starter.git`,
                  tmpDir,
                  '-b',
                  'templates',
                ]),
            },
            {
              title: 'Generating the module',
              task: async (): Promise<void> => {
                if (createModelFromTemplate(templatePath, '')) {
                  console.log('');
                  console.log(
                    chalk.green(
                      'Done. You can find the newly created module inside the src/app/ folder',
                    ),
                  );
                }
              },
            },
          ],
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          { concurrent: false, collapse: false },
        );
      },
    });
  } else {
    tasks.push({
      title: 'Setting up the module',
      task: (): Listr<any> => {
        return new Listr(
          [
            {
              title: 'Updating templates',
              task: (): execa.ExecaChildProcess<string> =>
                execa('git', ['pull'], { cwd: tmpDir }),
            },
            {
              title: 'Generating the module',
              task: async (): Promise<void> => {
                if (createModelFromTemplate(templatePath, '')) {
                  console.log('');
                  console.log(
                    chalk.green(
                      'Done. You can find the newly created module inside the src/app/ folder',
                    ),
                  );
                }
              },
            },
          ],
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          // @ts-ignore
          { concurrent: false, collapse: false },
        );
      },
    });
  }

  new Listr(tasks, {}).run().catch((err: any) => {
    console.error(err);
  });
}

export default generateModel;
