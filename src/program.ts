#!/usr/bin/env node

import { program } from 'commander'
import inquirer from 'inquirer'
import { cosmiconfigSync } from 'cosmiconfig'
import { initializeScript } from './scripts'
import { Input, InputOptions, Options } from './types'
const version = 'VERSION'

const explorer = cosmiconfigSync('pastoralist')

/**
 * getInput
 * @param {InputOptions.name} string}
 * @param {InputOptions.message} string
 * @returns {string}
 */
export async function getInput({
	name,
	message,
}: InputOptions): Promise<string> {
	const { name: input = '' }: Input = await inquirer.prompt({
		type: 'input',
		name,
		message,
	})
	return input ? input : ''
}

/**
 * initializeAction
 * @param {Options} Record}
 */
async function initializeAction(options: Options = {}) {
	const { config: defaultConfig = {} } = explorer.search() || {}
	const { isTestingCLI } = options
	const config = options?.config || defaultConfig
	try {
		// resolves "manager"
		const manager = options?.manager
			? options.manager
			: await getInput({
					name: 'manager',
					message:
						'Which package manager is used to manage overrides (resolutions)?',
			  })

		// resolves "overrides"
		const overrides = options?.overrides
			? options.overrides
			: await getInput({
					name: 'overrides',
					message:
						'What overrides (resolutions) object is used to specify overrides?',
			  })

		if (isTestingCLI) {
			console.log({ manager, options, overrides })
		}
		initializeScript({ config, overrides, manager, ...options })
	} catch (err) {
		console.error(err)
	}
}

program
	.version(version)
	.description('initialize pastoralist')
	.command('initialize')
	.option('-m, -mgr <manager>', 'specify the package manager used')
	.option(
		'-o, --overrides <overrides>',
		'specify the overrides/resolutions object to initialize with',
	)
	.option('-c, --config <config>', 'path to a unique config')
	.option('-t, --isTestingCLI', 'enables CLI testing, no scripts are run')
	.option('-p, --path <path>', 'the path to the package.json file to manage')
	.action(initializeAction as any)

export const pastoralist = program
export default pastoralist
