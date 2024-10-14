interface CapRoverExtraTheme {
    siderTheme?: string
}

export default interface CapRoverTheme {
    content: string
    name: string
    extraTheme?: CapRoverExtraTheme
    builtIn?: boolean
}
