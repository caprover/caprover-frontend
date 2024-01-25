import { PlusCircleOutlined, QuestionCircleFilled } from '@ant-design/icons'
import { Button, Card, Checkbox, Col, Input, Row, Tooltip } from 'antd'
import Search from 'antd/lib/input/Search'
import { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { IMobileComponent } from '../../models/ContainerProps'
import { localize } from '../../utils/Language'
import NewTabLink from '../global/NewTabLink'

interface MyProps {
    onCreateNewAppClicked: (appName: string, hasPersistency: boolean) => void
}

class CreateNewApp extends Component<
    MyProps & IMobileComponent,
    { appName: string; hasPersistency: boolean }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            hasPersistency: false,
            appName: '',
        }
    }

    onCreateNewAppClicked() {
        this.props.onCreateNewAppClicked(
            this.state.appName,
            this.state.hasPersistency
        )
    }
    render() {
        const self = this

        return (
            <Card
                title={
                    <span>
                        <PlusCircleOutlined />
                        &nbsp;&nbsp;&nbsp;{' '}
                        {localize('create_new_app.title', 'Create A New App')}
                    </span>
                }
            >
                <Row justify="center">
                    <Col lg={{ span: 12 }}>
                        <Row>
                            {self.props.isMobile ? (
                                <Fragment>
                                    <Input
                                        placeholder={localize(
                                            'create_new_app.placeholder',
                                            'my-amazing-app'
                                        )}
                                        onChange={(e) =>
                                            self.setState({
                                                appName: e.target.value,
                                            })
                                        }
                                    />
                                    <Button
                                        style={{ marginTop: 8 }}
                                        block
                                        onClick={() =>
                                            self.onCreateNewAppClicked()
                                        }
                                        type="primary"
                                    >
                                        {localize(
                                            'create_new_app.button',
                                            'Create New App'
                                        )}
                                    </Button>
                                </Fragment>
                            ) : (
                                <Search
                                    placeholder={localize(
                                        'create_new_app.placeholder',
                                        'my-amazing-app'
                                    )}
                                    enterButton={localize(
                                        'create_new_app.button',
                                        'Create New App'
                                    )}
                                    onChange={(e) =>
                                        self.setState({
                                            appName: e.target.value,
                                        })
                                    }
                                    onSearch={(value) =>
                                        self.onCreateNewAppClicked()
                                    }
                                />
                            )}
                        </Row>
                        <br />
                        <Row justify={self.props.isMobile ? 'start' : 'end'}>
                            <Checkbox
                                onChange={(e: any) =>
                                    self.setState({
                                        hasPersistency: !!e.target.checked,
                                    })
                                }
                            >
                                {localize(
                                    'create_new_app.has_persistent_data',
                                    'Has Persistent Data'
                                )}
                            </Checkbox>
                            &nbsp;&nbsp;
                            <NewTabLink url="https://caprover.com/docs/persistent-apps.html">
                                <Tooltip
                                    title={localize(
                                        'create_new_app.has_persistent_data_tooltip',
                                        'Mostly used for databases, see docs for details.'
                                    )}
                                >
                                    <span>
                                        <QuestionCircleFilled />
                                    </span>
                                </Tooltip>
                            </NewTabLink>
                        </Row>
                    </Col>
                    <Col lg={{ span: 12 }}>
                        <div style={{ textAlign: 'center' }}>
                            <p>
                                {localize(
                                    'create_new_app.or_select_from',
                                    'Or Select From'
                                )}
                            </p>
                            <Link to="/apps/oneclick/" className="ant-btn">
                                {localize(
                                    'create_new_app.one_click_apps',
                                    'One-Click Apps/Databases'
                                )}
                            </Link>
                        </div>
                    </Col>
                </Row>
            </Card>
        )
    }
}

function mapStateToProps(state: any) {
    return {
        isMobile: state.globalReducer.isMobile,
    }
}

export default connect<IMobileComponent, any, any>(
    mapStateToProps,
    undefined
)(CreateNewApp)
