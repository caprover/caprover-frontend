import {
    CheckCircleTwoTone,
    ExclamationCircleOutlined,
    RetweetOutlined,
} from '@ant-design/icons'
import { Card, Modal, Table, Tooltip } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import moment from 'moment'
import React, { Component, Fragment } from 'react'
import Utils from '../../../../utils/Utils'
import ClickableLink from '../../../global/ClickableLink'
import Timestamp from '../../../global/Timestamp'
import { IAppVersion } from '../../AppDefinition'

export default class AppVersionTable extends Component<{
    versions: IAppVersion[]
    deployedVersion: number
    onVersionRollbackRequested: (versionToRevert: IAppVersion) => void
    isMobile: boolean
}> {
    getStateRender(version: number, versionDetails: IAppVersion) {
        if (version === this.props.deployedVersion) {
            return (
                <Tooltip title="Current Version">
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                </Tooltip>
            )
        }

        const imageName = versionDetails.deployedImageName

        if (!imageName) {
            return (
                <Tooltip title="Failed deploy">
                    <ExclamationCircleOutlined />
                </Tooltip>
            )
        }

        return (
            <ClickableLink
                onLinkClicked={() => this.onRollbackClicked(versionDetails)}
            >
                <Tooltip title="Revert to this version">
                    <span>
                        <RetweetOutlined />
                    </span>
                </Tooltip>
            </ClickableLink>
        )
    }
    getCols() {
        const columns: ColumnProps<IAppVersion>[] = [
            {
                title: 'State',
                key: 'revertColumn', // arbitrary unique name for the column
                align: 'center',
                dataIndex: 'version' as 'version',
                render: (version: number, versionDetails: IAppVersion) =>
                    this.getStateRender(version, versionDetails),
            },
            {
                title: 'Version',
                align: 'center',
                dataIndex: 'version' as 'version',
            },
            {
                title: 'Deploy Time',
                dataIndex: 'timeStamp' as 'timeStamp',
                render: (timeStamp: string) => {
                    return <Timestamp timestamp={timeStamp} />
                },
            },
            {
                title: 'Image Name',
                dataIndex: 'deployedImageName' as 'deployedImageName',
            },
            {
                title: 'git hash',
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
                {`If you had previously deleted this image explicitly through disk cleanup,
      this revert process will fail.`}
                <br />
                <br />
                {`Do you want to continue with rolling back your app to `}
                <code>{imageName}</code>?
            </span>
        )
        if (imageName.indexOf('/') > 0) {
            content = (
                <span>
                    {`${imageName} appears to be hosted on Docker Registry.
        Make sure you have not deleted this image from the repository since it was originally deployed.
        Deletion usually does not happen automatically, so if you have not deleted the image intentionally,
        you don't need to worry about this.`}
                    <br />
                    <br />
                    {`Do you want to continue with rolling back your app to `}
                    <code>{imageName}</code>?
                </span>
            )
        }
        Modal.confirm({
            title: 'Rollback?',
            content,
            onOk: () => {
                self.props.onVersionRollbackRequested(versionToRevert)
            },
        })
    }

    render() {
        const self = this
        const versionsReversed = Utils.copyObject(self.props.versions).reverse()
        const columns = this.getCols()
        return (
            <div>
                <h3>Version History</h3>
                <div>
                    {this.props.isMobile ? (
                        versionsReversed.map(
                            (version, i) =>
                                i <= 5 && (
                                    <Card
                                        type="inner"
                                        key={i}
                                        style={{ marginBottom: 8 }}
                                        title={
                                            <Fragment>
                                                <Tooltip
                                                    title={moment(
                                                        new Date(
                                                            version.timeStamp
                                                        )
                                                    ).fromNow()}
                                                >
                                                    <span>
                                                        {new Date(
                                                            version.timeStamp
                                                        ).toLocaleString()}
                                                    </span>
                                                </Tooltip>
                                                <div>
                                                    {version.deployedImageName}
                                                </div>
                                            </Fragment>
                                        }
                                    >
                                        <div>
                                            <b>Version:</b> {version.version}
                                        </div>
                                        <div>
                                            <b>Git hash:</b>{' '}
                                            {version.gitHash || 'n/a'}
                                        </div>
                                        <div>
                                            <b>State:</b>{' '}
                                            {this.getStateRender(
                                                version.version,
                                                version
                                            )}
                                        </div>
                                    </Card>
                                )
                        )
                    ) : (
                        <Table
                            size="small"
                            rowKey="timeStamp"
                            pagination={{ pageSize: 5 }}
                            columns={columns}
                            dataSource={versionsReversed}
                        />
                    )}
                </div>
            </div>
        )
    }
}
