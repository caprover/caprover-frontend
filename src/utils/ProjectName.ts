export function normalizeProjectName(name: string): string {
    return `${name || ''}`.trim().toLowerCase().replace(/\s+/g, '-')
}

export function isProjectNameAllowed(name: string): boolean {
    return (
        !!name &&
        name.length < 50 &&
        /^[a-z]/.test(name) &&
        /[a-z0-9]$/.test(name) &&
        /^[a-z0-9-]+$/.test(name) &&
        name.indexOf('--') < 0 &&
        ['captain', 'root'].indexOf(name) < 0
    )
}
