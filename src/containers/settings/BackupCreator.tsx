import { CloudDownloadOutlined } from '@ant-design/icons'
import { Button, message, Row } from 'antd'
import React from 'react'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'

export default class BackupCreator extends ApiComponent<
    {
        isMobile: boolean
    },
    {
        isLoading: boolean
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            isLoading: false,
        }
    }

    onCreateBackupClicked() {
        const self = this
        self.setState({ isLoading: true })
        self.apiManager
            .createBackup()
            .then(function (data) {
                let link = document.createElement('a') // create 'a' element
                link.setAttribute(
                    'href',
                    `${self.apiManager.getApiBaseUrl()}/downloads/?namespace=captain&downloadToken=${encodeURIComponent(
                        data.downloadToken
                    )}`
                )
                link.click()

                message.success('Downloading backup started...')
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    render() {
        const self = this

        if (self.state.isLoading) {
            return <CenteredSpinner />
        }

        return (
            <div>
                <p>
                    Create a backup of CapRover configs in order to be able to
                    spin up a clone of this server. Note that your application
                    data (volumes, and images) are not part of this backup. This
                    backup only includes the server configuration details, such
                    as root domains, app names, SSL certs and etc.
                </p>
                <p>
                    See the documents for more details on how to restore your
                    server using the backup file.
                </p>
                <p>Note that this is, currently, an EXPERIMENTAL FEATURE.</p>
                <br />

                <Row justify="end">
                    <Button
                        type="primary"
                        block={this.props.isMobile}
                        onClick={() => this.onCreateBackupClicked()}
                    >
                        <span>
                            <CloudDownloadOutlined />
                        </span>{' '}
                        &nbsp; Create Backup
                    </Button>
                </Row>
            </div>
        )
    }
}
