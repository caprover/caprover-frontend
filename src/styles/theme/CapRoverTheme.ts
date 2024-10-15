interface CapRoverExtraTheme {
    siderTheme?: string
}

export default interface CapRoverTheme {
    content: string
    name: string
    extra?: CapRoverExtraTheme
    headEmbed?: string
    builtIn?: boolean
}
