import { EyeInvisibleOutlined } from '@ant-design/icons'
import { Button, Input } from 'antd'
import React, { Component, Fragment } from 'react'

export default class PasswordField extends Component<
    {
        placeholder?: string
        addonBefore?: string
        defaultValue: string
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    },
    any
> {
    constructor(props: any) {
        super(props)
        this.state = {
            isShowing: !props.defaultValue,
            hasValue: !!props.defaultValue,
        }
    }

    render() {
        const self = this
        return (
            <Fragment>
                {self.state.isShowing
                    ? self.createInput()
                    : self.createButton()}
            </Fragment>
        )
    }

    createButton() {
        const self = this
        return (
            <Button
                style={{ width: '100%' }}
                onClick={() => {
                    self.setState({ isShowing: true })
                }}
            >
                Show Password
            </Button>
        )
    }

    createInput() {
        const self = this
        return (
            <Input
                type="text"
                spellCheck={false}
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="off"
                placeholder={self.props.placeholder}
                addonBefore={self.props.addonBefore}
                defaultValue={self.props.defaultValue}
                // keep a suffix element at all times, otherwise antd remounts the input and it loses focus
                suffix={
                    self.state.hasValue ? (
                        <Button
                            type="text"
                            size="small"
                            title="Hide Password"
                            aria-label="Hide Password"
                            icon={<EyeInvisibleOutlined />}
                            onClick={() => {
                                self.setState({ isShowing: false })
                            }}
                        />
                    ) : (
                        <span />
                    )
                }
                onChange={(e) => {
                    self.setState({ hasValue: !!e.target.value })
                    self.props.onChange(e)
                }}
            />
        )
    }
}
