import { VolumeListItem } from '../models/VolumeInfo'

const DEFAULT_NAMESPACE = 'captain'

/**
 * Resolve the physical Docker volume name from a logical label.
 * Modern apps use the label as-is; legacy apps use `${namespace}--${label}`.
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
 * Return CapRover app names (excluding currentAppName) that already use
 * the given physical Docker volume name.
 */
export function getOtherAppsUsingVolume(
    physicalName: string,
    volumes: VolumeListItem[],
    currentAppName: string | undefined
): string[] {
    if (!physicalName) {
        return []
    }
    const match = volumes.find((v) => v.name === physicalName)
    if (!match) {
        return []
    }
    return (match.usedByAppNames || []).filter(
        (name) => name !== currentAppName
    )
}

/**
 * Replace a single `%s` placeholder in a localized template string.
 */
export function formatLocalized(template: string, value: string): string {
    return template.split('%s').join(value)
}
