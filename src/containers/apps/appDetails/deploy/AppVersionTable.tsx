import { Button, Modal, Table, Tooltip } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import { RotateCcw } from 'lucide-react'
import { Component } from 'react'
import { localize } from '../../../../utils/Language'
import Utils from '../../../../utils/Utils'
import Timestamp from '../../../global/Timestamp'
import { IAppVersion } from '../../AppDefinition'

export default class AppVersionTable extends Component<{
    versions: IAppVersion[]
    deployedVersion: number
    onVersionRollbackRequested: (versionToRevert: IAppVersion) => void
}> {
    renderStatus(version: number, versionDetails: IAppVersion) {
        const imageName = versionDetails.deployedImageName
        if (imageName && version === this.props.deployedVersion) {
            return (
                <span className="deployment-status-pill deployment-status-active">
                    <span
                        className="deployment-status-dot"
                        aria-hidden="true"
                    />
                    {localize('apps.deploy_status_active', 'Active')}
                </span>
            )
        }

        if (!imageName) {
            return (
                <Tooltip
                    title={localize(
                        'apps.deploy_no_image_tooltip',
                        'No deployed image'
                    )}
                >
                    <span className="deployment-status-pill deployment-status-failed">
                        {localize('apps.deploy_status_failed', 'Failed')}
                    </span>
                </Tooltip>
            )
        }

        return (
            <span className="deployment-status-pill deployment-status-succeeded">
                {localize('apps.deploy_status_succeeded', 'Succeeded')}
            </span>
        )
    }

    renderActions(version: number, versionDetails: IAppVersion) {
        const imageName = versionDetails.deployedImageName
        if (!imageName || version === this.props.deployedVersion) {
            return undefined
        }

        const revertLabel = localize(
            'apps.deploy_revert_to_version_tooltip',
            'Revert to this version'
        )
        return (
            <Tooltip title={revertLabel}>
                <Button
                    type="link"
                    size="small"
                    className="deployment-action-link"
                    aria-label={revertLabel}
                    icon={<RotateCcw size={13} aria-hidden="true" />}
                    onClick={() => this.onRollbackClicked(versionDetails)}
                >
                    {localize('apps.deploy_revert_action', 'Revert')}
                </Button>
            </Tooltip>
        )
    }

    getCols() {
        const columns: ColumnProps<IAppVersion>[] = [
            {
                title: localize('apps.deploy_version', 'Version'),
                dataIndex: 'version' as 'version',
                render: (version: number) => (
                    <span className="deployment-table-version">
                        {localize('apps.deploy_version', 'Version')} {version}
                    </span>
                ),
            },
            {
                title: localize('apps.deploy_status', 'Status'),
                key: 'status',
                dataIndex: 'version' as 'version',
                render: (version: number, versionDetails: IAppVersion) =>
                    this.renderStatus(version, versionDetails),
            },
            {
                title: localize('apps.deploy_image', 'Image'),
                dataIndex: 'deployedImageName' as 'deployedImageName',
                render: (imageName?: string) =>
                    imageName ? (
                        <Tooltip title={imageName}>
                            <code className="deployment-code deployment-table-image">
                                {imageName}
                            </code>
                        </Tooltip>
                    ) : (
                        <span
                            className="deployment-meta-muted"
                            aria-hidden="true"
                        >
                            —
                        </span>
                    ),
            },
            {
                title: localize('apps.deploy_deployed', 'Deployed'),
                dataIndex: 'timeStamp' as 'timeStamp',
                render: (timeStamp: string) => {
                    return timeStamp ? (
                        <span className="deployment-meta-text deployment-table-time">
                            <Timestamp timestamp={timeStamp} />
                        </span>
                    ) : undefined
                },
            },
            {
                title: localize('apps.deploy_git_hash_title', 'Git hash'),
                dataIndex: 'gitHash' as 'gitHash',
                render: (gitHashOriginal: string) => {
                    if (!gitHashOriginal) {
                        return (
                            <span
                                className="deployment-meta-muted"
                                aria-hidden="true"
                            >
                                —
                            </span>
                        )
                    }
                    const gitHash =
                        gitHashOriginal.length > 12
                            ? gitHashOriginal.substr(0, 10) + '...'
                            : gitHashOriginal
                    return (
                        <Tooltip title={gitHashOriginal}>
                            <code className="deployment-code">{gitHash}</code>
                        </Tooltip>
                    )
                },
            },
            {
                title: localize('apps.deploy_actions', 'Actions'),
                key: 'actions',
                align: 'right',
                dataIndex: 'version' as 'version',
                render: (version: number, versionDetails: IAppVersion) =>
                    this.renderActions(version, versionDetails),
            },
        ]
        return columns
    }

    onRollbackClicked(versionToRevert: IAppVersion) {
        const self = this
        const imageName = versionToRevert.deployedImageName!
        let content = (
            <span>
                {localize(
                    'apps.deploy_rollback_warning',
                    'If you had previously deleted this image explicitly through disk cleanup, this revert process will fail.'
                )}
                <br />
                <br />
                {localize(
                    'apps.deploy_rollback_warning_body',
                    'Do you want to continue with rolling back your app to this image: '
                )}
                <code className="deployment-code">{imageName}</code>?
            </span>
        )
        if (imageName.indexOf('/') > 0) {
            content = (
                <span>
                    {Utils.formatText(
                        localize(
                            'apps.deploy_rollback_registry_warning',
                            "This image (%s) appears to be hosted on Docker Registry. Make sure you have not deleted this image from the repository since it was originally deployed. Deletion usually does not happen automatically, so if you have not deleted the image intentionally, you don't need to worry about this."
                        ),
                        ['%s'],
                        [<span>{imageName}</span>]
                    )}
                    <br />
                    <br />{' '}
                    {localize(
                        'apps.deploy_rollback_warning_body',
                        'Do you want to continue with rolling back your app to this image: '
                    )}
                    <code className="deployment-code">{imageName}</code>?
                </span>
            )
        }
        Modal.confirm({
            title: localize('apps.deploy_rollback_confirm', 'Rollback?'),
            content,
            onOk: () => {
                self.props.onVersionRollbackRequested(versionToRevert)
            },
        })
    }

    render() {
        const versions = [...this.props.versions].sort(
            (a, b) => b.version - a.version
        )
        const columns = this.getCols()
        return (
            <Table
                className="deployment-history-table"
                rowKey="version"
                showHeader={versions.length > 0}
                pagination={{
                    pageSize: 5,
                    showSizeChanger: false,
                    hideOnSinglePage: true,
                }}
                scroll={versions.length > 0 ? { x: 600 } : undefined}
                columns={columns}
                dataSource={versions}
                locale={{
                    emptyText: (
                        <div className="deployment-empty-text">
                            {localize(
                                'apps.deploy_history_empty',
                                'No deployment history yet'
                            )}
                        </div>
                    ),
                }}
            />
        )
    }
}
