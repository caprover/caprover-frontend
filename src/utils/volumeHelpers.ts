import { IAppDef } from '../containers/apps/AppDefinition'

const DEFAULT_NAMESPACE = 'captain' // backend rootNameSpace; not exposed to UI

/** physical Docker volume name → sorted unique CapRover app names */
export type VolumeUsageIndex = Record<string, string[]>

/**
 * Resolve the physical Docker volume name from a logical label.
 * Modern apps use the label as-is; legacy apps use `${namespace}--${label}`.
 * Matches captain AppsDataStore.getVolumeName.
 */
export function resolvePhysicalVolumeName(
    volumeName: string,
    isLegacyAppName: boolean | undefined,
    namespace: string = DEFAULT_NAMESPACE
): string {
    const label = (volumeName || '').trim()
    if (!label) {
        return ''
    }
    if (isLegacyAppName) {
        return `${namespace}--${label}`
    }
    return label
}

/**
 * Build an index of physical volume names to CapRover app names from app definitions.
 * - Skips bind mounts (truthy hostPath), even if residual volumeName remains in draft UI.
 * - Resolves each volume with that source app's isLegacyAppName.
 */
export function buildVolumeUsageIndex(apps: IAppDef[]): VolumeUsageIndex {
    const map = new Map<string, Set<string>>()
    for (const app of apps) {
        const appName = app.appName
        if (!appName) {
            continue
        }
        for (const vol of app.volumes || []) {
            // Treat truthy hostPath as bind mount for warning purposes even if
            // volumeName is still non-empty in draft UI state.
            if (vol.hostPath) {
                continue
            }
            const physical = resolvePhysicalVolumeName(
                vol.volumeName || '',
                app.isLegacyAppName
            )
            if (!physical) {
                continue
            }
            if (!map.has(physical)) {
                map.set(physical, new Set())
            }
            map.get(physical)!.add(appName)
        }
    }
    const out: VolumeUsageIndex = {}
    map.forEach((names, key) => {
        out[key] = Array.from(names).sort()
    })
    return out
}

/**
 * Return CapRover app names (excluding currentAppName) that already use
 * the physical Docker volume corresponding to the given logical label.
 * Lookup resolves with the current app's isLegacyAppName.
 */
export function getOtherAppsUsingVolumeLabel(
    volumeName: string,
    isLegacyAppName: boolean | undefined,
    currentAppName: string | undefined,
    index: VolumeUsageIndex
): string[] {
    const physical = resolvePhysicalVolumeName(volumeName, isLegacyAppName)
    if (!physical) {
        return []
    }
    const users = index[physical] || []
    return users.filter((name) => name !== currentAppName)
}

/**
 * Replace a single `%s` placeholder in a localized template string.
 */
export function formatLocalized(template: string, value: string): string {
    return template.split('%s').join(value)
}
