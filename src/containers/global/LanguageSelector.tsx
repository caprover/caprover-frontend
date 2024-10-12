import { Select } from 'antd'
import { Component } from 'react'
import { connect } from 'react-redux'
import { emitRootKeyChanged } from '../../redux/actions/GlobalActions'
import {
    getCurrentLanguageOption,
    languagesOptions,
    setCurrentLanguageOption,
} from '../../utils/Language'

class LanguageSelector extends Component<
    { forceReload?: boolean; emitRootKeyChanged: Function },
    { currentLanguage: string }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            currentLanguage: getCurrentLanguageOption().value,
        }
    }

    handleChange(value: string) {
        const self = this

        setCurrentLanguageOption(value)
        self.setState({ currentLanguage: value })
        self.props.emitRootKeyChanged()
        if (self.props.forceReload) {
            window.location.reload()
        }
    }

    render() {
        const self = this
        return (
            <Select
                style={{ width: 150 }}
                options={languagesOptions}
                value={self.state.currentLanguage}
                onChange={(v) => {
                    self.handleChange(v)
                }}
            />
        )
    }
}

export default connect(
    undefined,
    {
        emitRootKeyChanged: emitRootKeyChanged,
    },
    undefined,
    { forwardRef: true }
)(LanguageSelector)
