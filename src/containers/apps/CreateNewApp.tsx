import { PlusCircleOutlined, QuestionCircleFilled } from '@ant-design/icons'
import { Button, Card, Checkbox, Col, Input, Row, Tooltip } from 'antd'
import Search from 'antd/lib/input/Search'
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { IMobileComponent } from '../../models/ContainerProps'
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
            <Row justify="center">
                <Col xs={{ span: 23 }} lg={{ span: 10 }}>
                    <Card
                        title={
                            <span>
                                <PlusCircleOutlined />
                                &nbsp;&nbsp;&nbsp;Create A New App
                            </span>
                        }
                    >
                        <Row>
                            {self.props.isMobile ? (
                                <Fragment>
                                    <Input
                                        placeholder="my-amazing-app"
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
                                        Create New App
                                    </Button>
                                </Fragment>
                            ) : (
                                <Search
                                    placeholder="my-amazing-app"
                                    enterButton="Create New App"
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
                                Has Persistent Data
                            </Checkbox>
                            &nbsp;&nbsp;
                            <Tooltip title="Mostly used for databases, see docs for details.">
                                <NewTabLink url="https://caprover.com/docs/persistent-apps.html">
                                    <span>
                                        <QuestionCircleFilled />
                                    </span>
                                </NewTabLink>
                            </Tooltip>
                        </Row>

                        <br />

                        <hr />

                        <br />
                        <div style={{ textAlign: 'center' }}>
                            <p>Or Select From</p>
                            <Link to="/apps/oneclick/" className="ant-btn">
                                One-Click Apps/Databases
                            </Link>
                        </div>
                    </Card>
                </Col>
            </Row>
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
