#!/usr/bin/env node
import { resolve } from 'path'
// import { constants, copyFile, writeFile } from 'fs'
import { Options } from './types'

export function manageJSON(options: Options) {
	const path = options.path ? `${options.path}/` : ''
	const pkgJSON = resolve(`${path}package.json`)
	const json = import(pkgJSON, { assert: { type: 'json' } })
	// const config = options?.config
	// 	? resolve(options.config)
	// 	: json?.pastoralist || {}
	// const { resolutions = {}, overrides = {} } = json
	console.log({ json })
}

export function initializeScript(options) {
	const { path } = options
}
