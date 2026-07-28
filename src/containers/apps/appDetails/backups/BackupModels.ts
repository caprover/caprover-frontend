export type IRcloneRemoteType = 's3' | 'b2' | 'gdrive' | 'sftp' | 'raw'

export interface IRcloneRemoteMasked {
    id: string
    name: string
    type: IRcloneRemoteType
}

export interface IBackupSource {
    volumeName: string
    /** Path within the volume to back up. Empty = the whole volume. */
    path?: string
}

export interface IAppBackupConfig {
    enabled: boolean
    remoteId: string
    remotePath: string
    sources: IBackupSource[]
    cronSchedule?: string
    timezone?: string
    retentionDays?: number
    preBackupCommand?: string
    postBackupCommand?: string
    preRestoreCommand?: string
    postRestoreCommand?: string
}

export type IBackupJobType = 'backup' | 'restore'
export type IBackupJobStatus = 'running' | 'success' | 'failed'

export interface IBackupJobRecord {
    id: string
    appName: string
    type: IBackupJobType
    remoteId: string
    volumeNames: string[]
    status: IBackupJobStatus
    startedAt: number
    finishedAt?: number
    exitCode?: number
    error?: string
    logFile: string
}
