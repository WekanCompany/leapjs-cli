#!/usr/bin/env node
/* eslint-disable no-console */
import chalk from 'chalk';
import commander from 'commander';
import packageJson from '../package.json';
import generateCore from './choices/project';
import generateModel from './choices/model';

const cli = new commander.Command();

cli
  .version(packageJson.version, '-v, --version', 'output the current version')
  .usage('[command]');

const nCmd = cli.command('new').alias('n');
const gCmd = cli.command('generate').alias('g');

nCmd
  .command('new', 'create a new project')
  .usage('name destination')
  .description('Create a new project. Eg. leap new project ./ -t queues')
  .option('-s, --skip-install', 'Skip package installation')
  .option(
    '-p, --package-manager <manager>',
    'Specify the package manager to use. Use npm or yarn.' +
      'Package manager must be installed globally.',
  )
  .option(
    '-t, --template <type>',
    'Project template to use. The default template does not support queues ootb. default, queues',
    'default',
  )
  .passCommandToAction(false)
  .action((source: any, destination: any): any => {
    if (!destination) {
      nCmd.outputHelp();
    }
    if (Array.isArray(destination)) {
      if (destination.length < 2) {
        // eslint-disable-next-line no-console
        console.log(
          chalk.red('Please provide a project name and desitination'),
        );
        console.log('');
        nCmd.outputHelp();
        process.exit(0);
      }
      generateCore(
        nCmd.template,
        destination[0],
        destination[1],
        nCmd.packageManger,
        nCmd.skipInstall,
      );
    }
  });

gCmd
  .command('generate', 'generate')
  .usage('name project_root_location')
  .description('Generate new modules')
  .option('-c, --crud', 'Creates a module with CRUD endpoints (Default)')
  .option('-e, --empty', 'Creates an empty module')
  .passCommandToAction(false)
  .action((source: any, destination: any): any => {
    if (!destination) {
      gCmd.outputHelp();
    }
    if (gCmd.crud && gCmd.empty) {
      console.log(
        chalk.red('Please provide only one option, either --crud or --empty'),
      );
      process.exit(0);
    }
    if (Array.isArray(destination)) {
      if (destination.length < 2) {
        // eslint-disable-next-line no-console
        console.log(
          chalk.red('Please provide a module name and project root location'),
        );
        console.log('');
        gCmd.outputHelp();
        process.exit(0);
      }
      const type = gCmd.empty ? 'base' : 'crud';
      generateModel(type, destination[0], destination[1]);
    }
  });

cli.parse(process.argv);

if (!process.argv.slice(2).length) {
  cli.outputHelp();
}
