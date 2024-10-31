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
    catchupFreqSelect: string | undefined
    logRetentionSelect: string | undefined

    rotationFreqCustom: string | undefined
    catchupFreqCustom: string | undefined
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
            catchupFreqSelect: this.valueOrCustom(
                this.catchupFrequencyOptions,
                props.goAccessInfo.data.catchupFrequencyCron
            ),
            logRetentionSelect:
                props.goAccessInfo.data.logRetentionDays === undefined
                    ? '-1'
                    : this.valueOrCustom(
                          this.logRetentionOptions,
                          props.goAccessInfo.data.logRetentionDays.toString()
                      ),
            rotationFreqCustom: props.goAccessInfo.data.rotationFrequencyCron,
            catchupFreqCustom: props.goAccessInfo.data.catchupFrequencyCron,
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
        { value: '0 0 * * 0', label: 'Weekly' },
        { value: '0 0 1 * *', label: 'Monthly' },
        { value: '0 0 1 */2 *', label: 'Every 2 Months' },
        { value: '0 0 1 */4 *', label: 'Every 4 Months' },
        { value: CUSTOM, label: 'Custom' },
    ]

    catchupFrequencyOptions = [
        { value: '* * * * *', label: 'Every Minute' },
        { value: '*/10 * * * *', label: 'Every 10 Minutes' },
        { value: '0 * * * *', label: 'Every Hour' },
        { value: '0 */6 * * *', label: 'Every 6 Hours' },
        { value: '0 0 * * *', label: 'Every Day' },
        { value: CUSTOM, label: 'Custom' },
    ]

    logRetentionOptions = [
        { value: '-1', label: 'Indefinitely' },
        { value: '30', label: '30 Days' },
        { value: '183', label: '6 Months' },
        { value: '365', label: 'One Year' },
        { value: CUSTOM, label: 'Custom' },
    ]

    updateRotationFrequency(selectValue?: string, customValue?: string) {
        if (customValue !== undefined) {
            this.setState({ rotationFreqCustom: customValue })
        } else {
            this.setState({ rotationFreqSelect: selectValue })
        }
    }

    updateCatchupFrequency(selectValue?: string, customValue?: string) {
        if (customValue !== undefined) {
            this.setState({ catchupFreqCustom: customValue })
        } else {
            this.setState({ catchupFreqSelect: selectValue })
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

        updated.data.catchupFrequencyCron =
            (this.state.catchupFreqSelect === CUSTOM
                ? this.state.catchupFreqCustom
                : this.state.catchupFreqSelect) ?? '0 * * * *'

        updated.data.logRetentionDays =
            this.state.logRetentionSelect === CUSTOM
                ? this.state.logRetentionCustom
                : Number(this.state.logRetentionSelect)

        // Handle indefinite log rotation specially
        if (updated.data.logRetentionDays === -1) {
            updated.data.logRetentionDays = undefined
        }

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
                                    placeholder="Valid Crontab Expression"
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
                                'goaccess_settings.catchup_frequency',
                                'Catch Up Report Processing Frequency'
                            )}
                        >
                            <Select
                                style={{ width: 200, marginRight: '1em' }}
                                options={this.catchupFrequencyOptions}
                                value={this.state.catchupFreqSelect}
                                onChange={(value) =>
                                    this.updateCatchupFrequency(value)
                                }
                            />
                            {this.state.catchupFreqSelect === CUSTOM && (
                                <Input
                                    style={{ width: 200 }}
                                    placeholder="Valid Crontab Expression"
                                    value={this.state.catchupFreqCustom}
                                    required
                                    onChange={(e) =>
                                        this.updateCatchupFrequency(
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
                                'Log Retention Days'
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
                                    placeholder="365"
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
