import { Component, PropsWithChildren } from 'react'

export default class NewTabLink extends Component<
    PropsWithChildren<{ url: string; className?: string; title?: string }>,
    {}
> {
    render() {
        // eslint-disable-next-line
        return (
            <a
                href={this.props.url}
                target="_blank"
                rel="noopener noreferrer"
                className={this.props.className}
                title={this.props.title}
                aria-label={this.props.title}
            >
                {this.props.children}
            </a>
        )
    }
}
