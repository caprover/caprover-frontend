import {
    Alert,
    Button,
    Card,
    Col,
    Progress,
    Row,
    Space,
    Spin,
    Tag,
    theme,
} from 'antd'
import { CapRoverModels } from 'caprover-api'
import { RouteComponentProps } from 'react-router'
import DiskUsageViewState from '../../models/DiskUsageViewState'
import { localize } from '../../utils/Language'

interface DiskUsageProps {
    compact?: boolean
    diskUsage: DiskUsageViewState
    history: RouteComponentProps<any>['history']
    refreshDiskUsage: () => void
}

interface DiskUsageAlertProps {
    diskUsage: DiskUsageViewState
    history: RouteComponentProps<any>['history']
}

const BYTES_PER_UNIT = 1000
const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'

    const unitIndex = Math.min(
        Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT)),
        BYTE_UNITS.length - 1
    )
    const value = bytes / Math.pow(BYTES_PER_UNIT, unitIndex)
    return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${BYTE_UNITS[unitIndex]}`
}

function getReading(data?: CapRoverModels.DiskUsageResponse) {
    const node = data && data.nodes[0]
    const disk = node && node.disks[0]

    if (!node || !disk) return undefined

    return { node, disk }
}

function getUsedPercent(disk: CapRoverModels.DiskUsageDisk): number {
    return Math.round((disk.usedBytes / disk.totalBytes) * 100)
}

function getAvailablePercent(disk: CapRoverModels.DiskUsageDisk): number {
    return Math.round((disk.availableBytes / disk.totalBytes) * 100)
}

function getSeverityLabel(severity: CapRoverModels.DiskUsageSeverity): string {
    if (severity === 'critical') {
        return localize('disk_usage.status_critical', 'Critical')
    }
    if (severity === 'warning') {
        return localize('disk_usage.status_warning', 'Warning')
    }
    return localize('disk_usage.status_healthy', 'Healthy')
}

export function DiskUsageAlert({ diskUsage, history }: DiskUsageAlertProps) {
    const reading = getReading(diskUsage.data)

    if (!reading || reading.disk.severity === 'normal') return <></>

    const isCritical = reading.disk.severity === 'critical'
    const title = isCritical
        ? localize(
              'disk_usage.critical_alert_title',
              'Disk space is critically low'
          )
        : localize(
              'disk_usage.warning_alert_title',
              'Disk space is running low'
          )

    return (
        <Alert
            className="disk-usage-alert"
            showIcon
            type={isCritical ? 'error' : 'warning'}
            message={
                <span>
                    
                    {localize(
                        'disk_usage.alert_summary',
                        '%s1 on %s2. %s3 available (%s4% of capacity).'
                    ).replace(/%s([1-4])/g, (_, index) =>
                        [
                            title,
                            reading.node.hostname,
                            formatBytes(reading.disk.availableBytes),
                            String(getAvailablePercent(reading.disk)),
                        ][Number(index) - 1]
                    )}
                    {' '}
                    {localize(
                        'disk_usage.failure_warning',
                        'Builds and deployments may fail.'
                    )}
                    {diskUsage.refreshFailed &&
                        ` ${localize(
                            'disk_usage.refresh_failed',
                            'Could not refresh disk usage. These values may be outdated.'
                        )}`}
                </span>
            }
            action={
                <Button
                    size="small"
                    type="link"
                    onClick={() => history.push('/monitoring')}
                >
                    {localize('disk_usage.view_disk_usage', 'View disk usage')}
                </Button>
            }
        />
    )
}

export default function DiskUsage({
    diskUsage,
    history,
    refreshDiskUsage,
    compact,
}: DiskUsageProps) {
    const { token } = theme.useToken()
    const reading = getReading(diskUsage.data)
    let cardContent: JSX.Element
    let cardExtra: JSX.Element | undefined

    if (!reading && !diskUsage.refreshFailed) {
        cardContent = (
            <div style={{ textAlign: 'center' }}>
                <Spin />
            </div>
        )
    } else if (!reading) {
        cardContent = (
            <Alert
                showIcon
                type="warning"
                message={localize(
                    'disk_usage.unavailable',
                    'Disk usage is unavailable'
                )}
                description={localize(
                    'disk_usage.unavailable_description',
                    'CapRover could not read the disk capacity.'
                )}
                action={
                    <Button size="small" onClick={refreshDiskUsage}>
                        {localize('disk_usage.try_again', 'Try again')}
                    </Button>
                }
            />
        )
    } else {
        const usedPercent = getUsedPercent(reading.disk)
        const progressStatus =
            reading.disk.severity === 'critical' ? 'exception' : 'normal'
        const progressColor =
            reading.disk.severity === 'warning' ? token.colorWarning : undefined

        cardExtra = (
            <Space>
                {diskUsage.isLoading && <Spin size="small" />}
                <Tag
                    color={
                        reading.disk.severity === 'critical'
                            ? 'error'
                            : reading.disk.severity === 'warning'
                              ? 'warning'
                              : 'success'
                    }
                >
                    {getSeverityLabel(reading.disk.severity)}
                </Tag>
            </Space>
        )
        cardContent = (
            <>
                {diskUsage.refreshFailed && (
                    <Alert
                        showIcon
                        type="warning"
                        message={localize(
                            'disk_usage.refresh_failed',
                            'Could not refresh disk usage. These values may be outdated.'
                        )}
                        action={
                            <Button size="small" onClick={refreshDiskUsage}>
                                {localize('disk_usage.try_again', 'Try again')}
                            </Button>
                        }
                        style={{ marginBottom: 20 }}
                    />
                )}

                <div style={{ fontSize: 28, fontWeight: 600 }}>
                    {formatBytes(reading.disk.availableBytes)}
                </div>
                <div style={{ marginBottom: 18 }}>
                    {localize(
                        'disk_usage.capacity_summary',
                        '%s1 available of %s2 on %s3'
                    ).replace(/%s([1-3])/g, (_, index) =>
                        [
                            formatBytes(reading.disk.availableBytes),
                            formatBytes(reading.disk.totalBytes),
                            reading.node.hostname,
                        ][Number(index) - 1]
                    )}
                </div>

                <Progress
                    percent={usedPercent}
                    status={progressStatus}
                    strokeColor={progressColor}
                    format={(percent) =>
                        `${percent}% ${localize('disk_usage.used', 'used')}`
                    }
                />

                {!compact && (
                    <>
                        <div style={{ marginTop: 14 }}>
                            {localize(
                                'disk_usage.scope_description',
                                "This is the filesystem that backs CapRover's data directory. Its capacity includes all usage on that filesystem."
                            )}
                        </div>
                        <div>
                            {localize(
                                'disk_usage.severity_description',
                                'Status is based on available capacity; filesystem-reserved space is not shown as used.'
                            )}
                        </div>
                    </>
                )}
                <div style={{ marginTop: 10 }}>
                    <Button
                        type="link"
                        onClick={() =>
                            history.push('/maintenance#disk-cleanup')
                        }
                    >
                        {localize(
                            'disk_usage.review_cleanup',
                            'Review disk cleanup'
                        )}
                    </Button>
                </div>
            </>
        )
    }

    return (
        <Row justify="center">
            <Col xs={{ span: 24 }}>
                <Card
                    title={localize('disk_usage.title', 'Disk Usage')}
                    extra={cardExtra}
                >
                    {cardContent}
                </Card>
            </Col>
        </Row>
    )
}
