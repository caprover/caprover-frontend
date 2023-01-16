import React, { MouseEvent, PropsWithChildren } from 'react'

export default class ClickableLink extends React.Component<
    PropsWithChildren<{ onLinkClicked: Function }>,
    {}
> {
    handleClick(e: MouseEvent) {
        e.preventDefault()
        if (this.props.onLinkClicked) this.props.onLinkClicked()
    }

    render() {
        // eslint-disable-next-line
        return <a onClick={(e) => this.handleClick(e)}>{this.props.children}</a>
    }
}
