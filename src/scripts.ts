#!/usr/bin/env node
import { resolve } from 'path'
// import { constants, copyFile, writeFile } from 'fs'
import { getManager, getOverrides } from './prompt'
import { Options } from './types'

/**
 *
 * @param param0
 * @returns
 */
export async function resolveConfig({ explorer, options }) {
	const { config: defaultConfig = {} } = explorer.search() || {}
	const config = options?.config || defaultConfig
	const manager = options?.manager ? options.manager : await getManager()
	const overrides = options?.overrides
		? options.overrides
		: await getOverrides()

	return { config, overrides, manager, ...options }
}

import { resolve } from 'path'
import { sync } from 'fast-glob'

export function generatePackageOverridesList = ({ overridesList }) {
  return overridesList.reduce((list, overriddenItem) => {
      if (dependenciesList.includes(overriddenItem)) {
        list = {
					...list,
					[overriddenItem]: {
						...acc[overriddenItem],
						[name]: [version],
					},
				}
			}
      return list
    }, {})
}

export function generateOverridesList() {
  const mainPackageJSON = resolve('package.json')
  const mainJSON = require(mainPackageJSON)
  const overrides = Object.assign({}, mainJSON?.overrides, mainJSON?.resolutions)
  const overridesList = Object.keys(overrides)
  const nodeModulePackageJSONs = sync(['node_modules/**/package.json'])

  nodeModulePackageJSONs.reduce((acc, packageJSON) => {
    const { dependencies = {}, name, version } = require(resolve(packageJSON)) || {}
    const dependenciesList = Object.keys(dependencies)
    if (!dependenciesList.length) return acc
    const hasOverriddenDependencies = dependenciesList.some(dependencyItem => overridesList.includes(dependencyItem))
    if (!hasOverriddenDependencies) return acc
    const overriddenDependents = generateSinglePackageOverriddenDependents({ overridesList });
    acc = {
      ...acc,
      ...overriddenDependents,
    }
    return acc
  }, {})
}

/**
 * managePackageJSON
 * @description manages root package.json
 * @param options
 * @returns {record}
 * @note the package should resolve a projects root or specified
 */
export function managePackageJSON(options: Options) {
	const path = options?.path ? `${options.path}/` : ''
	console.log({ test: 'hello', path })
	const packageJSON = resolve(`${path}package.json`)
	// resolve pasturalist items
	// const config = options?.config ? resolve(options.config) : json?.pastoralist || {}
	// const { resolutions = {}, overrides = {} } = json
	console.log({ test: 'hello', path, packageJSON })
}

// export function checkThePasture(config) {
// 	console.log({ config })
// }
