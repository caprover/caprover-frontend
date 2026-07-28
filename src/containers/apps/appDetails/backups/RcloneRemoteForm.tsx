import { Input, Modal, Select } from 'antd'
import { Component } from 'react'
import { localize } from '../../../../utils/Language'
import { IRcloneRemoteType } from './BackupModels'

const { TextArea } = Input

interface FieldDef {
    key: string
    label: string
    placeholder?: string
    textarea?: boolean
    optional?: boolean
}

// Per-type form fields. None of these backends require an obscured password:
// object stores use API keys, SFTP uses a private key, and `raw` lets the user
// paste any rclone.conf section body.
const FIELDS_BY_TYPE: { [k in IRcloneRemoteType]: FieldDef[] } = {
    s3: [
        { key: 'access_key_id', label: 'Access Key ID' },
        { key: 'secret_access_key', label: 'Secret Access Key' },
        {
            key: 'endpoint',
            label: 'Endpoint',
            placeholder: 'https://s3.eu-west-1.amazonaws.com',
            optional: true,
        },
        { key: 'region', label: 'Region', optional: true },
    ],
    b2: [
        { key: 'account', label: 'Account ID / Key ID' },
        { key: 'key', label: 'Application Key' },
    ],
    gdrive: [
        {
            key: 'service_account_json',
            label: 'Service Account JSON',
            textarea: true,
            placeholder: '{ "type": "service_account", ... }',
        },
        { key: 'root_folder_id', label: 'Root Folder ID', optional: true },
    ],
    sftp: [
        { key: 'host', label: 'Host' },
        { key: 'port', label: 'Port', placeholder: '22', optional: true },
        { key: 'user', label: 'User' },
        {
            key: 'private_key',
            label: 'Private Key (PEM)',
            textarea: true,
            placeholder: '-----BEGIN OPENSSH PRIVATE KEY-----',
        },
    ],
    raw: [
        {
            key: 'conf',
            label: 'rclone.conf section body',
            textarea: true,
            placeholder: 'type = webdav\nurl = https://dav.example.com\n...',
        },
    ],
}

interface RcloneRemoteFormProps {
    visible: boolean
    onCancel: () => void
    onSubmit: (
        name: string,
        type: IRcloneRemoteType,
        params: { [k: string]: string }
    ) => void
}

interface RcloneRemoteFormState {
    name: string
    type: IRcloneRemoteType
    params: { [k: string]: string }
}

export default class RcloneRemoteForm extends Component<
    RcloneRemoteFormProps,
    RcloneRemoteFormState
> {
    constructor(props: RcloneRemoteFormProps) {
        super(props)
        this.state = {
            name: '',
            type: 's3',
            params: {},
        }
    }

    render() {
        const self = this
        const fields = FIELDS_BY_TYPE[this.state.type]

        return (
            <Modal
                title={localize(
                    'apps.backups_add_remote',
                    'Add a backup destination'
                )}
                open={this.props.visible}
                onCancel={() => this.props.onCancel()}
                onOk={() =>
                    this.props.onSubmit(
                        this.state.name.trim(),
                        this.state.type,
                        this.state.params
                    )
                }
                okButtonProps={{
                    disabled: !this.state.name.trim(),
                }}
                destroyOnClose
            >
                <div style={{ marginBottom: 12 }}>
                    <div>{localize('apps.backups_remote_name', 'Name')}</div>
                    <Input
                        value={this.state.name}
                        onChange={(e) =>
                            self.setState({ name: e.target.value })
                        }
                        placeholder="my-s3-bucket"
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <div>{localize('apps.backups_remote_type', 'Type')}</div>
                    <Select<IRcloneRemoteType>
                        style={{ width: '100%' }}
                        value={this.state.type}
                        onChange={(value) =>
                            self.setState({ type: value, params: {} })
                        }
                        options={[
                            { value: 's3', label: 'S3-compatible' },
                            { value: 'b2', label: 'Backblaze B2' },
                            { value: 'gdrive', label: 'Google Drive' },
                            { value: 'sftp', label: 'SFTP' },
                            { value: 'raw', label: 'Raw rclone.conf' },
                        ]}
                    />
                </div>

                {fields.map((field) => (
                    <div key={field.key} style={{ marginBottom: 12 }}>
                        <div>
                            {field.label}
                            {field.optional && (
                                <span style={{ opacity: 0.5 }}>
                                    {' '}
                                    (optional)
                                </span>
                            )}
                        </div>
                        {field.textarea ? (
                            <TextArea
                                rows={4}
                                value={this.state.params[field.key] || ''}
                                placeholder={field.placeholder}
                                onChange={(e) =>
                                    self.updateParam(field.key, e.target.value)
                                }
                            />
                        ) : (
                            <Input
                                value={this.state.params[field.key] || ''}
                                placeholder={field.placeholder}
                                onChange={(e) =>
                                    self.updateParam(field.key, e.target.value)
                                }
                            />
                        )}
                    </div>
                ))}
            </Modal>
        )
    }

    private updateParam(key: string, value: string) {
        this.setState((prev) => ({
            params: { ...prev.params, [key]: value },
        }))
    }
}
