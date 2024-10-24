import { DeleteOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, Col, Input, Row, Tooltip, message } from 'antd'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'
import UnusedImagesTable from './UnusedImagesTable'

export interface IUnusedImage {
    tags: string[]
    id: string
}

export default class DiskCleanup extends ApiComponent<
    {
        isMobile: boolean
    },
    {
        isLoading: boolean
        mostRecentLimit: number
        unusedImages?: IUnusedImage[]
        selectedImagesForDelete: string[]
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            isLoading: false,
            mostRecentLimit: 2,
            selectedImagesForDelete: [],
            unusedImages: [],
        }
    }

    onRemoveImagesClicked() {
        const self = this
        this.setState({ isLoading: true })
        this.apiManager
            .deleteImages(this.state.selectedImagesForDelete)
            .then(function () {
                message.success(
                    localize(
                        'disk_cleanup.unused_images_deleted',
                        'Unused images are deleted.'
                    )
                )
                self.refreshOldImagesList()
            })
            .catch(
                Toaster.createCatcher(function () {
                    self.setState({ isLoading: false })
                })
            )
    }

    refreshOldImagesList() {
        const self = this
        this.setState({ unusedImages: undefined, isLoading: true })
        return this.apiManager
            .getUnusedImages(this.state.mostRecentLimit)
            .then(function (data) {
                self.setState({ unusedImages: data.unusedImages })
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

        const unusedImages = this.state.unusedImages

        if (!unusedImages) {
            return <ErrorRetry />
        }

        const hasSelectedImagesForRemoval = !!(
            self.state.selectedImagesForDelete &&
            self.state.selectedImagesForDelete.length
        )

        return (
            <div>
                <div>
                    <p>
                        {localize(
                            'disk_cleanup.default_parameter_info',
                            'With default parameter, it keeps the last two recent builds of all current apps, and creates a list of images that can be deleted (by clicking on Get List button). You can select which images you want to delete and click on Remove Images button. You might notice that some images are not deleted even though you clicked on Remove Images, it means they are being directly or indirectly in-use by Docker. A common example For indirect usage is an image whose child image is being used by an alive container.'
                        )}
                    </p>

                    <br />
                </div>

                <Row>
                    <Col span={12}>
                        <Tooltip
                            title={localize(
                                'disk_cleanup.tooltip_for_input',
                                'For example, enter 2 in order to exclude 2 most recent builds during clean-up'
                            )}
                        >
                            <Input
                                addonBefore={localize(
                                    'disk_cleanup.keep_most_recent',
                                    'Keep most recent'
                                )}
                                type="number"
                                value={this.state.mostRecentLimit + ''}
                                onChange={(e) => {
                                    this.setState({
                                        mostRecentLimit: Number(e.target.value),
                                    })
                                }}
                            />
                        </Tooltip>
                    </Col>
                    <Col span={12}>
                        <Row justify="end">
                            <Button
                                type="default"
                                onClick={() => this.refreshOldImagesList()}
                            >
                                <span>
                                    <SyncOutlined />
                                </span>{' '}
                                &nbsp;{' '}
                                {localize('disk_cleanup.get_list', 'Get List')}
                            </Button>
                        </Row>
                    </Col>
                </Row>

                <div
                    className={unusedImages.length > 0 ? '' : 'hide-on-demand'}
                >
                    <div style={{ height: 20 }} />
                    <Row justify="end">
                        <Tooltip
                            title={
                                hasSelectedImagesForRemoval
                                    ? ''
                                    : localize(
                                          'disk_cleanup.select_images_for_removal',
                                          'Select images that you want to remove. You can select all from the top row.'
                                      )
                            }
                        >
                            <Button
                                disabled={!hasSelectedImagesForRemoval}
                                type="primary"
                                block={this.props.isMobile}
                                onClick={() => {
                                    self.onRemoveImagesClicked()
                                }}
                            >
                                <span>
                                    <DeleteOutlined />{' '}
                                </span>{' '}
                                &nbsp;{' '}
                                {localize(
                                    'disk_cleanup.remove_unused_images',
                                    'Remove Unused Images'
                                )}
                            </Button>
                        </Tooltip>
                    </Row>
                    <div style={{ height: 20 }} />
                    <div>
                        {localize(
                            'disk_cleanup.note_about_images',
                            'Images that are being used (directly or indirectly) will not be deleted even if you select them.'
                        )}
                    </div>
                    <div style={{ height: 20 }} />
                    <UnusedImagesTable
                        unusedImages={unusedImages}
                        isMobile={this.props.isMobile}
                        selectedImagesForDelete={
                            this.state.selectedImagesForDelete
                        }
                        updateModel={(selectedImagesForDelete) =>
                            this.setState({ selectedImagesForDelete })
                        }
                    />
                </div>
            </div>
        )
    }
}
