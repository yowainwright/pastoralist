#!/usr/bin/env node
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
