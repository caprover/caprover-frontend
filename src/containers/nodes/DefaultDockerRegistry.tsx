import { EditOutlined } from '@ant-design/icons'
import { Alert, Modal, Select } from 'antd'
import { Component } from 'react'
import { IRegistryApi } from '../../models/IRegistryInfo'
import { localize } from '../../utils/Language'
import Utils from '../../utils/Utils'
import ClickableLink from '../global/ClickableLink'

const Option = Select.Option
const NONE = 'none'
const DISABLED_PUSH = 'disabled push'

export default class DefaultDockerRegistry extends Component<
    {
        apiData: IRegistryApi
        changeDefault: (regId: string) => void
    },
    { isInEditMode: boolean; newSelectedDefaultId: string }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            isInEditMode: false,
            newSelectedDefaultId: '',
        }
    }

    getDefaultRegText() {
        const registries = this.props.apiData.registries
        const defaultPushRegistryId = this.props.apiData.defaultPushRegistryId
        for (let index = 0; index < registries.length; index++) {
            const element = registries[index]
            if (element.id === defaultPushRegistryId) {
                return `${element.registryUser} @ ${element.registryDomain}`
            }
        }

        return DISABLED_PUSH
    }

    getAllOptions() {
        const registries = Utils.copyObject(this.props.apiData.registries)
        return registries.map(function (element) {
            return (
                <Option value={element.id} key={element.id}>
                    {`${element.registryUser} @ ${element.registryDomain}`}
                </Option>
            )
        })
    }

    render() {
        const self = this

        return (
            <div>
                <Modal
                    title={localize(
                        'default_docker_reg.edit_push_registry',
                        'Edit Push Registry'
                    )}
                    okText={localize(
                        'default_docker_reg.save_and_update',
                        'Save and Update'
                    )}
                    onCancel={() => self.setState({ isInEditMode: false })}
                    onOk={() => {
                        self.setState({ isInEditMode: false })
                        self.props.changeDefault(
                            self.state.newSelectedDefaultId
                        )
                    }}
                    open={self.state.isInEditMode}
                >
                    <p>
                        {Utils.formatText(
                            localize(
                                'default_docker_reg.default_registry_info',
                                "Default Docker Registry is the registry that will be used to store your newly built images. You can select %s1 if you don't want to push your newly built images to any docker registry. Keep in mind that if you use %s2, cluster nodes (if you happen to have more than one server) will not be able to run your applications."
                            ),
                            ['%s1', '%s2'],
                            [
                                <code>{DISABLED_PUSH}</code>,
                                <code>{DISABLED_PUSH}</code>,
                            ]
                        )}
                    </p>
                    <p>
                        {localize(
                            'default_docker_reg.change_default_registry',
                            'Change the default Docker Registry:'
                        )}
                    </p>
                    <Select
                        defaultValue={
                            this.props.apiData.defaultPushRegistryId || NONE
                        }
                        style={{ width: 300 }}
                        onChange={(value: string) => {
                            if (value === NONE) {
                                this.setState({ newSelectedDefaultId: '' })
                            } else {
                                this.setState({ newSelectedDefaultId: value })
                            }
                        }}
                    >
                        <Option value={NONE}>{DISABLED_PUSH}</Option>
                        {self.getAllOptions()}
                    </Select>

                    <div
                        style={{ marginTop: 20 }}
                        className={
                            !!self.state.newSelectedDefaultId
                                ? 'hide-on-demand'
                                : ''
                        }
                    >
                        <Alert
                            showIcon={true}
                            type="warning"
                            message={localize(
                                'default_docker_reg.cluster_warning',
                                'If you have a cluster (more than one server), you need to have a default push registry. If you only have one single server, disabling default push registry is fine.'
                            )}
                        />
                    </div>
                </Modal>
                <h3>
                    {localize(
                        'default_docker_reg.default_push_registry',
                        'Default Push Registry'
                    )}
                </h3>
                <p>
                    {localize(
                        'default_docker_reg.docker_registry_for_pushing_images',
                        'Docker Registry for Pushing New Images:'
                    )}{' '}
                    <ClickableLink
                        onLinkClicked={() => {
                            self.setState({
                                isInEditMode: true,
                                newSelectedDefaultId:
                                    self.props.apiData.defaultPushRegistryId ||
                                    '',
                            })
                        }}
                    >
                        <code>{this.getDefaultRegText()}</code> <EditOutlined />
                    </ClickableLink>
                </p>
            </div>
        )
    }
}
