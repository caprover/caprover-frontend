import { Input } from 'antd'
import React, { Component, Fragment } from 'react'
import yaml from 'yaml'

function ensureStringifiedJson(raw: string) {
    raw = (raw || '').trim()
    if (!raw.length) {
        return ''
    }

    if (raw.startsWith('{') || raw.startsWith('[')) {
        return raw
    }

    try {
        return JSON.stringify(yaml.parse(raw))
    } catch (err) {
        console.log(err)
    }
    return ''
}

export default class InputJsonifier extends Component<
    {
        placeholder?: string
        defaultValue?: string
        onChange: (jsonStringified: string) => void
    },
    {}
> {
    constructor(props: any) {
        super(props)
        this.state = {}
    }

    render() {
        const self = this
        return (
            <Fragment>
                {' '}
                <Input.TextArea
                    className="code-input"
                    placeholder={self.props.placeholder}
                    rows={10}
                    defaultValue={self.props.defaultValue}
                    onChange={(e) => {
                        self.props.onChange(
                            ensureStringifiedJson(e.target.value)
                        )
                    }}
                />
            </Fragment>
        )
    }
}
