export type InputOptions = {
	defaultName: string
	name: string
	message: string
}

export type Input = {
	name: string
}

export type Options = {
	config?: any
	isTestingCLI?: boolean
	manager?: string
	overrides?: string
	path?: string
}
