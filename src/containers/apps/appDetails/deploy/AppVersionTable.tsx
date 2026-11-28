import {
    CheckCircleTwoTone,
    ExclamationCircleOutlined,
    RetweetOutlined,
} from '@ant-design/icons'
import { Button, Flex, Modal, Table, Tooltip } from 'antd'
import { ColumnProps } from 'antd/lib/table'
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
    getStateRender(version: number, versionDetails: IAppVersion) {
        const imageName = versionDetails.deployedImageName
        if (imageName && version === this.props.deployedVersion) {
            return (
                <Flex align="center" justify="center" gap={6}>
                    <CheckCircleTwoTone
                        twoToneColor="#52c41a"
                        aria-hidden="true"
                    />
                    {localize(
                        'apps.deploy_current_version_tooltip',
                        'Current Version'
                    )}
                </Flex>
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
                    <ExclamationCircleOutlined />
                </Tooltip>
            )
        }

        return (
            <Tooltip
                title={localize(
                    'apps.deploy_revert_to_version_tooltip',
                    'Revert to this version'
                )}
            >
                <Button
                    type="link"
                    size="small"
                    aria-label={localize(
                        'apps.deploy_revert_to_version_tooltip',
                        'Revert to this version'
                    )}
                    icon={<RetweetOutlined />}
                    onClick={() => this.onRollbackClicked(versionDetails)}
                />
            </Tooltip>
        )
    }
    getCols() {
        const columns: ColumnProps<IAppVersion>[] = [
            {
                title: localize('apps.deploy_state', 'State'),
                key: 'revertColumn', // arbitrary unique name for the column
                align: 'center',
                dataIndex: 'version' as 'version',
                render: (version: number, versionDetails: IAppVersion) =>
                    this.getStateRender(version, versionDetails),
            },
            {
                title: localize('apps.deploy_version', 'Version'),
                align: 'center',
                dataIndex: 'version' as 'version',
            },
            {
                title: localize('apps.deploy_time', 'Deploy Time'),
                dataIndex: 'timeStamp' as 'timeStamp',
                render: (timeStamp: string) => {
                    return timeStamp ? (
                        <Timestamp timestamp={timeStamp} />
                    ) : undefined
                },
            },
            {
                title: localize('apps.deploy_image_name', 'Image Name'),
                dataIndex: 'deployedImageName' as 'deployedImageName',
            },
            {
                title: localize('apps.deploy_git_hash', 'git hash'),
                dataIndex: 'gitHash' as 'gitHash',
                render: (
                    gitHashOriginal: string,
                    versionDetails: IAppVersion
                ) => {
                    let gitHash = gitHashOriginal || ''
                    if (gitHash.length > 12) {
                        gitHash = gitHash.substr(0, 10) + '...'
                    }
                    return (
                        <Tooltip title={gitHashOriginal}>
                            <div className="code-input">{gitHash || 'n/a'}</div>
                        </Tooltip>
                    )
                },
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
                <code>{imageName}</code>?
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
                    <code>{imageName}</code>?
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
                size="small"
                rowKey="version"
                pagination={{ pageSize: 5, showSizeChanger: false }}
                scroll={{ x: 680 }}
                columns={columns}
                dataSource={versions}
                locale={{
                    emptyText: localize(
                        'apps.deploy_history_empty',
                        'No deployment history yet'
                    ),
                }}
            />
        )
    }
}
