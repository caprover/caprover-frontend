export interface DockerVolumeInfo {
    name: string // physical Docker volume name
    driver: string
    mountpoint: string
    scope: 'local' | 'global' | string
    labels: { [key: string]: string } // always object (never null)
    options: { [key: string]: string } | null
    size?: number // rarely present; DO NOT use for conflict logic
    refCount?: number // rarely present; DO NOT use for conflict logic
    createdAt?: string
}

export interface VolumeListItem extends DockerVolumeInfo {
    usedByAppNames: string[] // always present; CapRover app names
    isLikelySystem: boolean // always present; UX heuristic only, NOT security
}

export interface VolumesListResponse {
    volumes: VolumeListItem[]
}
