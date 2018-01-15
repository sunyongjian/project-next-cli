import inquirer from 'inquirer'
import { dirs } from './utils/defs'
import { readdir } from 'mz/fs'
import { resolve } from 'path'
import { exists } from 'mz/fs'
import rc from './utils/rc'
import copy from './utils/copy'
import loading from './utils/loading'
import metal from './helper/metalsimth'
import rmfr from 'rmfr'

export default async function apply() {
	let answers
	
	
	if(!await exists(dirs.download)) {
		throw new Error(`There is no ${dirs.download}, Please install a template`)
	}
	
	const list = await readdir(dirs.download)
	
	if(list.length === 0) {
		throw new Error(`There is no any scaffolds in your local folder ${dirs.download}, install it`)
	}
	
	answers = await inquirer.prompt([
		{
			type: 'list',
			name: 'scaffold',
			message: 'which scaffold do you want to init?',
			choices: list
		}, {
			type: 'input',
			name: 'dir',
			message: 'project name',
			async validate(input) {
				const done = this.async()
				
				if(input.length == 0) {
					done('You must input project name')
					return
				}
				
				const dir = resolve(process.cwd(), input)
				
				if(await exists(dir)) {
					done('The project name is already existed. Please change another name')
				}
				
				done(null, true)
			}
		}
	])
	
	let loader
	const metalsmith = await rc('metalsmith')
	if(metalsmith) {
		const tmp = `${dirs.tmp}/${answers.scaffold}`
		// copy the scaffold to temp dir
		await copy(`${dirs.download}/${answers.scaffold}`, tmp)
		
		// metalsmith the scaffold to metalsmith dir
		await metal(answers.scaffold)
		loader = loading('compiling', answers.dir)
		
		await copy(`${tmp}/${dirs.metalsmith}`, answers.dir)
		await rmfr(tmp)
	} else {
		loader = loading('generating', answers.dir)
		await copy(`${dirs.download}/${answers.scaffold}`, answers.dir)
	}
	loader.succeed()
}
