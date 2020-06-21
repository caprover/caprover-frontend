import { InboxOutlined } from '@ant-design/icons'
import { Button, Col, message, Row, Upload } from 'antd'
import { UploadChangeParam, UploadFile } from 'antd/lib/upload/interface'
import React from 'react'
import Toaster from '../../../../utils/Toaster'
import ApiComponent from '../../../global/ApiComponent'

export default class TarUploader extends ApiComponent<
    {
        appName: string
        onUploadSucceeded: () => void
    },
    {
        fileToBeUploaded: UploadFile | undefined
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            fileToBeUploaded: undefined,
        }
    }

    beforeUpload = (file: File) => {
        // We handle upload manually :)
        return false
    }

    handleChange = (info: UploadChangeParam) => {
        if (info.fileList.length > 1) {
            message.error(
                'You can only upload one TAR file! Remove the currently selected file first.'
            )
            return
        }

        if (info.fileList.length === 0) {
            this.setState({ fileToBeUploaded: undefined })
            message.info('File removed')
            return
        }

        let file = info.fileList[0]

        if (file.name.indexOf('.tar') < 0) {
            message.error('You can only upload a TAR file!')
            return
        }

        this.setState({ fileToBeUploaded: file })
    }

    startUploadAndDeploy() {
        const self = this

        const file = self.state.fileToBeUploaded!
        self.setState({ fileToBeUploaded: undefined })
        message.info('Upload has started')

        Promise.resolve()
            .then(function () {
                return self.apiManager.uploadAppData(
                    self.props.appName,
                    file.originFileObj! as File
                )
            })
            .then(function () {
                self.props.onUploadSucceeded()
            })
            .catch(
                Toaster.createCatcher(function () {
                    self.setState({ fileToBeUploaded: file })
                })
            )
    }

    render() {
        return (
            <div>
                <Row justify="center">
                    <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <Upload.Dragger
                            name="files"
                            accept="*/*"
                            multiple={false}
                            fileList={
                                this.state.fileToBeUploaded
                                    ? [this.state.fileToBeUploaded]
                                    : undefined
                            }
                            listType="text"
                            onChange={this.handleChange}
                            beforeUpload={this.beforeUpload}
                            action="//" // this is unused as beforeUpload always returns false
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">
                                Click or drag TAR file to this area to upload
                            </p>
                            <p className="ant-upload-hint">
                                Must contain <code>captain-definition</code>{' '}
                                file.
                            </p>
                        </Upload.Dragger>
                    </Col>
                </Row>

                <Row justify="center">
                    <Button
                        style={{ marginTop: 40 }}
                        disabled={!this.state.fileToBeUploaded}
                        onClick={() => this.startUploadAndDeploy()}
                        type="primary"
                        size="large"
                    >
                        Upload &amp; Deploy
                    </Button>
                </Row>
            </div>
        )
    }
}
