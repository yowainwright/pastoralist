#!/usr/bin/env node

import { program } from 'commander'
import { cosmiconfigSync } from 'cosmiconfig'

import { Input, InputOptions, Options } from './types'
import { resolveConfig } from './utils'
const version = 'VERSION'

const explorer = cosmiconfigSync('pastoralist')

/**
 * initialize
 * @description initialize pastoralist
 * @param {Options} Record}
 */
async function initialize(options: Options = {}) {
	try {
		const config = await resolveConfig({ explorer, options })

		// cli testing
		const { isTestingCLI } = config
		if (isTestingCLI) {
			console.info({ config })
		}

		// script will be here
	} catch (err) {
		console.error(err)
	}
}

async function update(options: Options = {}) {
	try {
		const config = await resolveConfig({ explorer, options })

		// cli testing
		const { isTestingCLI } = config
		if (isTestingCLI) {
			console.info({ config })
		}

		// script will be here
	} catch (err) {
		console.error(err)
	}
}

program
	.version(version)
	.description('Pastoralist, a utility CLI to manage your dependency overrides')
	.option('-c, --config <config>', 'path to a unique config')
	.option('-p, --path <path>', 'the path to the package.json file to manage')
	.option('-t, --isTestingCLI', 'enables CLI testing, no scripts are run')
	.parse(process.argv)
	.action(initialize as any)

program
	.command('update', 'updates Pastoralist and overrides')
	.option('-c, --config <config>', 'path to a unique config')
	.option('-p, --path <path>', 'the path to the package.json file to manage')
	.option('-t, --isTestingCLI', 'enables CLI testing, no scripts are run')
	.action(update as any)

// program.command('check', 'check for resolution updates').action(check as any)

export const pastoralist = program
export default pastoralist
