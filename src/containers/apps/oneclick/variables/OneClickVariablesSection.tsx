import { Alert, Button, Col, Input, message, Row } from 'antd'
import { Component } from 'react'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'
import { IHashMapGeneric } from '../../../../models/IHashMapGeneric'
import { IOneClickVariable } from '../../../../models/IOneClickAppModels'
import Utils from '../../../../utils/Utils'

export default class OneClickVariablesSection extends Component<
    {
        oneClickAppVariables: IOneClickVariable[]
        onNextClicked: (values: IHashMapGeneric<string>) => void
    },
    {
        enteredVariables: IHashMapGeneric<string>
        blurredFields: IHashMapGeneric<boolean>
    }
> {
    constructor(props: any) {
        super(props)

        let enteredVariables: IHashMapGeneric<string> = {}
        this.props.oneClickAppVariables.forEach((v) => {
            const defaultValue = v.defaultValue
            if (defaultValue) {
                enteredVariables[v.id] = defaultValue
            }
        })

        this.state = {
            enteredVariables,
            blurredFields: {},
        }
    }

    onNextClicked() {
        const self = this
        const blurredFields = Utils.copyObject(self.state.blurredFields)
        let allFieldValid = true
        self.props.oneClickAppVariables.forEach((v) => {
            blurredFields[v.id] = true
            if (!self.isFieldValueValid(v)) {
                allFieldValid = false
            }
        })

        if (!allFieldValid) {
            message.error('Fix all errors before deploying.')
        } else {
            self.props.onNextClicked(self.state.enteredVariables)
        }
        self.setState({ blurredFields })
    }

    isFieldValueValid(variable: IOneClickVariable) {
        const self = this
        const currVal = self.state.enteredVariables[variable.id] || ''
        let isEnteredValueValid = true
        if (variable.validRegex) {
            // From https://stackoverflow.com/questions/39154255/converting-regexp-to-string-then-back-to-regexp
            let parts = /\/(.*)\/(.*)/.exec(variable.validRegex)
            if (
                !parts /*This should never happen!*/ ||
                !new RegExp(parts[1], parts[2]).test(currVal)
            ) {
                isEnteredValueValid = false
            }
        }

        return isEnteredValueValid
    }

    createTextFields() {
        const self = this
        return this.props.oneClickAppVariables.map((variable) => {
            const currVal = self.state.enteredVariables[variable.id]

            return (
                <div key={variable.id} style={{ marginBottom: 40 }}>
                    <h4>{variable.label}</h4>
                    <div
                        style={{ paddingBottom: 5, fontSize: '90%' }}
                        className={
                            !!variable.description ? '' : 'hide-on-demand'
                        }
                    >
                        <ReactMarkdown remarkPlugins={[gfm]}>
                            {variable.description || ''}
                        </ReactMarkdown>
                    </div>

                    <Row>
                        <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                            <Input
                                type="text"
                                placeholder={variable.defaultValue}
                                value={
                                    currVal === undefined
                                        ? variable.defaultValue
                                        : currVal
                                }
                                onChange={(e) => {
                                    const newModel = Utils.copyObject(
                                        this.state.enteredVariables
                                    )
                                    newModel[variable.id] = e.target.value
                                    this.setState({
                                        enteredVariables: newModel,
                                    })
                                }}
                                onBlur={(e) => {
                                    const blurredFields = Utils.copyObject(
                                        self.state.blurredFields
                                    )
                                    blurredFields[variable.id] = true
                                    self.setState({ blurredFields })
                                }}
                            />
                            <div style={{ height: 5 }} />
                            <Alert
                                className={
                                    !self.state.blurredFields[variable.id] ||
                                    self.isFieldValueValid(variable)
                                        ? 'hide-on-demand'
                                        : ''
                                }
                                showIcon
                                message={
                                    <span>
                                        Invalid value. Does not match Regex:
                                        <code>{variable.validRegex}</code>
                                    </span>
                                }
                                type="error"
                            />
                        </Col>
                    </Row>
                </div>
            )
        })
    }

    render() {
        const self = this
        return (
            <div>
                <div>{this.createTextFields()}</div>
                <Row justify="end">
                    <Button
                        size="large"
                        style={{ minWidth: 150 }}
                        type="primary"
                        onClick={() => self.onNextClicked()}
                    >
                        Deploy
                    </Button>
                </Row>
            </div>
        )
    }
}
