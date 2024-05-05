import { Button, Col, Input, Row, Select, Tooltip, message } from 'antd'
import { IAutomatedCleanupConfigs } from '../../models/AutomatedCleanupConfigs'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import { Timezones } from './Timezones'

function formatHourOffset(offset: number) {
    const sign = offset >= 0 ? '+' : '-'
    const intPart = Math.floor(Math.abs(offset))
    const decimalPart = Math.abs(offset) % 1
    const hours = intPart.toString().padStart(2, '0')
    const minutes = decimalPart === 0.5 ? '30' : '00'
    return `${sign}${hours}:${minutes}`
}

const timeZones: any[] = []
Timezones.filter((x) => !x.isdst).forEach((element) => {
    element.utc.forEach((utc) => {
        timeZones.push({
            label: `${utc} (UTC${formatHourOffset(element.offset)})`,
            value: utc,
        })
    })
})

export default class AutomaticDiskCleanup extends ApiComponent<
    {
        isMobile: boolean
    },
    {
        isLoading: boolean
        automatedCleanupConfigs: IAutomatedCleanupConfigs | undefined
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            isLoading: false,
            automatedCleanupConfigs: undefined,
        }
    }

    componentDidMount() {
        const self = this
        self.setState({ isLoading: true })
        this.apiManager
            .getDiskCleanUpSettings()
            .then(function (data: IAutomatedCleanupConfigs) {
                self.setState({ automatedCleanupConfigs: data })
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
                <div>
                    <p>
                        Every time you deploy a new build, Docker builds a new
                        image for you. Typically, a large part of this image is
                        shared between the old version and the new version, but
                        a small chunk is added to your disk with each build. You
                        can read more about disk cleanup in the docs, but as a
                        simple interface, this widget gives you the ability to
                        perform image cleanups on demand.
                    </p>
                    <p>
                        By default, CapRover keeps a few most recent images for
                        your app so that you can rollback to a previous version
                        if needed. Also, CapRover uses a simple crontab
                        scheduler, for example,{' '}
                        <code
                            onClick={(e) => {
                                navigator.clipboard.writeText(`0 1 * * *`)
                                message.info('Copied to clipboard!')
                            }}
                        >
                            0 1 * * *{' '}
                        </code>{' '}
                        &nbsp; results in running cleanup every day at 1am.
                    </p>
                    <Row>
                        {' '}
                        <Col span={12}>
                            {' '}
                            <Tooltip title="Use a simple crontab expression to schedule a cleanup ">
                                <Input
                                    addonBefore="Cron Schedule"
                                    placeholder="leave empty to disable cleanup"
                                    value={
                                        (this.state.automatedCleanupConfigs
                                            ?.cronSchedule || '') + ''
                                    }
                                    onChange={(e) => {
                                        const automatedCleanupConfigs =
                                            Utils.copyObject(
                                                self.state
                                                    .automatedCleanupConfigs
                                            )
                                        if (automatedCleanupConfigs)
                                            automatedCleanupConfigs.cronSchedule =
                                                e.target.value
                                        self.setState({
                                            automatedCleanupConfigs:
                                                automatedCleanupConfigs,
                                        })
                                    }}
                                />
                            </Tooltip>
                        </Col>
                        <Col span={12}>
                            <Row justify="end">
                                <Select
                                    style={{ minWidth: 300 }}
                                    showSearch
                                    placeholder="Timezone"
                                    optionFilterProp="label"
                                    onChange={(value: string) => {
                                        const automatedCleanupConfigs =
                                            Utils.copyObject(
                                                self.state
                                                    .automatedCleanupConfigs
                                            )
                                        if (automatedCleanupConfigs)
                                            automatedCleanupConfigs.timezone =
                                                value
                                        self.setState({
                                            automatedCleanupConfigs:
                                                automatedCleanupConfigs,
                                        })
                                    }}
                                    onSearch={(value: string) => {
                                        // console.log('search:', value)
                                    }}
                                    filterOption={(
                                        input: string,
                                        option?: {
                                            label: string
                                            value: string
                                        }
                                    ) =>
                                        (option?.label ?? '')
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                    options={timeZones}
                                />
                            </Row>
                        </Col>
                    </Row>

                    <Row style={{ marginTop: 10 }}>
                        <Col span={12}>
                            <Tooltip title="For example, enter 2 in order to exclude 2 most recent builds during clean-up">
                                <Input
                                    addonBefore="Keep most recent"
                                    type="number"
                                    value={
                                        this.state.automatedCleanupConfigs
                                            ?.mostRecentLimit + ''
                                    }
                                    onChange={(e) => {
                                        const newConfig = Utils.copyObject(
                                            self.state.automatedCleanupConfigs
                                        )
                                        if (!newConfig) return
                                        newConfig.mostRecentLimit = Number(
                                            e.target.value
                                        )
                                        this.setState({
                                            automatedCleanupConfigs: newConfig,
                                        })
                                    }}
                                />
                            </Tooltip>
                        </Col>

                        <Col span={12}>
                            <Row justify="end">
                                <Button
                                    type="default"
                                    onClick={() => {
                                        if (
                                            !self.state.automatedCleanupConfigs
                                        ) {
                                            message.error('Invalid data')
                                            return
                                        }

                                        self.setState({ isLoading: true })

                                        self.apiManager
                                            .setDiskCleanUpSettings(
                                                self.state
                                                    .automatedCleanupConfigs
                                                    .mostRecentLimit,
                                                self.state
                                                    .automatedCleanupConfigs
                                                    .cronSchedule,
                                                self.state
                                                    .automatedCleanupConfigs
                                                    ?.timezone
                                            )
                                            .then(function () {
                                                message.success(
                                                    'Settings saved successfully!'
                                                )
                                            })
                                            .catch(Toaster.createCatcher())
                                            .then(function () {
                                                self.setState({
                                                    isLoading: false,
                                                })
                                            })
                                    }}
                                >
                                    Save
                                </Button>
                            </Row>
                        </Col>
                    </Row>
                    <br />
                </div>
            </div>
        )
    }
}
