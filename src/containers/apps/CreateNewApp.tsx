import React, { Component, Fragment } from 'react'
import { Row, Col, Card, Checkbox, Button, Icon, Tooltip, Input } from 'antd'
import Search from 'antd/lib/input/Search'
import { connect } from 'react-redux'
import NewTabLink from '../global/NewTabLink'

class CreateNewApp extends Component<
    {
        onCreateNewAppClicked: (
            appName: string,
            hasPersistency: boolean
        ) => void
        onCreateOneClickAppClicked: () => void
        isMobile: boolean
    },
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

    onCreateOneClickAppClicked() {
        this.props.onCreateOneClickAppClicked()
    }

    render() {
        const self = this

        return (
            <Row type="flex" justify="center">
                <Col xs={{ span: 23 }} lg={{ span: 10 }}>
                    <Card
                        title={
                            <span>
                                <Icon type="plus-circle" />
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
                        <Row
                            type="flex"
                            justify={self.props.isMobile ? 'start' : 'end'}
                        >
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
                                        <Icon
                                            type="question-circle"
                                            theme="filled"
                                        />
                                    </span>
                                </NewTabLink>
                            </Tooltip>
                        </Row>

                        <br />

                        <hr />

                        <br />
                        <div style={{ textAlign: 'center' }}>
                            <p>Or Select From</p>
                            <Button
                                onClick={() =>
                                    self.onCreateOneClickAppClicked()
                                }
                            >
                                One-Click Apps/Databases
                            </Button>
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

export default connect(mapStateToProps, undefined)(CreateNewApp)
