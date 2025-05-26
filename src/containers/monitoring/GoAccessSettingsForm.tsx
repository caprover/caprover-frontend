import { Button, Form, Input, Row, Select } from 'antd'
import { Component } from 'react'
import IGoAccessInfo from '../../models/IGoAccessInfo'
import { localize } from '../../utils/Language'

interface GoAccessSettingsProps {
    goAccessInfo: IGoAccessInfo
    saveSettings: (goAccessInfo: IGoAccessInfo) => void
}

interface GoAccessSettingsState {
    rotationFreqSelect: string | undefined
    logRetentionSelect: string | undefined

    rotationFreqCustom: string | undefined
    logRetentionCustom: number | undefined
}

const CUSTOM = 'custom'

export default class GoAccessSettingsForm extends Component<
    GoAccessSettingsProps,
    GoAccessSettingsState
> {
    constructor(props: GoAccessSettingsProps) {
        super(props)
        this.state = {
            rotationFreqSelect: this.valueOrCustom(
                this.rotationFrequencyOptions,
                props.goAccessInfo.data.rotationFrequencyCron
            ),
            logRetentionSelect: this.valueOrCustom(
                this.logRetentionOptions,
                (props.goAccessInfo.data.logRetentionDays || 180).toString()
            ),
            rotationFreqCustom: props.goAccessInfo.data.rotationFrequencyCron,
            logRetentionCustom: props.goAccessInfo.data.logRetentionDays,
        }
    }

    valueOrCustom(
        options: { value: string | undefined }[],
        value: string | undefined
    ) {
        return options.some((o) => o.value === value) ? value : CUSTOM
    }

    rotationFrequencyOptions = [
        {
            value: '0 0 * * 0',
            label: localize('goaccess_settings.weekly', 'Weekly'),
        },
        {
            value: '0 0 1 * *',
            label: localize('goaccess_settings.monthly', 'Monthly'),
        },
        {
            value: '0 0 1 */2 *',
            label: localize(
                'goaccess_settings.every_2_months',
                'Every 2 Months'
            ),
        },
        {
            value: '0 0 1 */4 *',
            label: localize(
                'goaccess_settings.every_4_months',
                'Every 4 Months'
            ),
        },
        {
            value: CUSTOM,
            label: localize('goaccess_settings.custom', 'Custom'),
        },
    ]

    logRetentionOptions = [
        { value: '180', label: '180' },
        { value: '365', label: '365' },
        {
            value: CUSTOM,
            label: localize('goaccess_settings.custom', 'Custom'),
        },
    ]

    updateRotationFrequency(selectValue?: string, customValue?: string) {
        if (customValue !== undefined) {
            this.setState({ rotationFreqCustom: customValue })
        } else {
            this.setState({ rotationFreqSelect: selectValue })
        }
    }

    updateLogRetention(selectValue?: string, customValue?: string) {
        let updated: number | undefined = undefined
        const input = selectValue ?? customValue

        if (input !== undefined) {
            const parsed = parseInt(input)
            if (!isNaN(parsed)) {
                updated = parsed
            }
        }

        if (customValue !== undefined) {
            this.setState({ logRetentionCustom: updated })
        } else {
            this.setState({ logRetentionSelect: selectValue })
        }
    }

    save() {
        const updated = { ...this.props.goAccessInfo }
        // Custom fields are required to submit so should always be filled out, but have defaults just in case and for type safety

        updated.data.rotationFrequencyCron =
            (this.state.rotationFreqSelect === CUSTOM
                ? this.state.rotationFreqCustom
                : this.state.rotationFreqSelect) ?? '0 0 1 * *'

        updated.data.logRetentionDays =
            this.state.logRetentionSelect === CUSTOM
                ? this.state.logRetentionCustom
                : Number(this.state.logRetentionSelect)

        this.props.saveSettings(updated)
    }

    render() {
        return (
            <Form layout="vertical">
                <div>
                    <h3>
                        {localize(
                            'goaccess_settings.goaccess_settings',
                            'GoAccess Settings'
                        )}
                    </h3>
                    <hr />
                    <br />

                    <div>
                        <Form.Item
                            label={localize(
                                'goaccess_settings.rotation_frequency',
                                'Log Rotation and Report Generation Frequency'
                            )}
                        >
                            <Select
                                style={{ width: 200, marginRight: '1em' }}
                                options={this.rotationFrequencyOptions}
                                value={this.state.rotationFreqSelect}
                                onChange={(value) =>
                                    this.updateRotationFrequency(value)
                                }
                            />
                            {this.state.rotationFreqSelect === CUSTOM && (
                                <Input
                                    style={{ width: 200 }}
                                    placeholder={localize(
                                        'goaccess_settings.crontab_placeholder',
                                        'Valid Crontab Expression'
                                    )}
                                    value={this.state.rotationFreqCustom}
                                    required
                                    onChange={(e) =>
                                        this.updateRotationFrequency(
                                            undefined,
                                            e.target.value
                                        )
                                    }
                                />
                            )}
                        </Form.Item>

                        <Form.Item
                            label={localize(
                                'goaccess_settings.log_retention',
                                'Log and Report Retention Days'
                            )}
                        >
                            <Select
                                style={{ width: 200, marginRight: '1em' }}
                                options={this.logRetentionOptions}
                                value={this.state.logRetentionSelect}
                                onChange={(value) =>
                                    this.updateLogRetention(value)
                                }
                            />
                            {this.state.logRetentionSelect === CUSTOM && (
                                <Input
                                    type="number"
                                    style={{ width: 200 }}
                                    placeholder={localize(
                                        'goaccess_settings.log_retention_placeholder',
                                        'Number of days'
                                    )}
                                    required
                                    value={this.state.logRetentionCustom}
                                    onChange={(e) =>
                                        this.updateLogRetention(
                                            undefined,
                                            e.target.value
                                        )
                                    }
                                />
                            )}
                        </Form.Item>
                    </div>
                </div>
                <br />
                <Row justify="end">
                    <Button
                        type="primary"
                        htmlType="submit"
                        onClick={() => this.save()}
                    >
                        {localize('goaccess.update', 'Update GoAccess')}
                    </Button>
                </Row>
            </Form>
        )
    }
}
