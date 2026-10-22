export function isEnteringMonitoring(
    previousPath: string,
    currentPath: string
): boolean {
    const isMonitoringPath = (path: string) =>
        path === '/monitoring' || path.startsWith('/monitoring/')

    return !isMonitoringPath(previousPath) && isMonitoringPath(currentPath)
}
