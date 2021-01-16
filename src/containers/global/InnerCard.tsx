import React, { Component } from 'react'
import { connect } from 'react-redux'
export class InnerCard extends Component<any, any> {
    render() {
        return (
            <div
                {...this.props}
                style={{
                    ...this.props.style,
                    ...(this.props.isDarkMode
                        ? {
                              border: '1px solid #303030',
                              backgroundColor: '#000',
                          }
                        : {
                              border: '1px solid #dddddd',
                              backgroundColor: '#fbfbfb',
                          }),
                }}
            >
                {this.props.children}
            </div>
        )
    }
}

function mapStateToProps(state: any) {
    console.log(state.globalReducer.isDarkMode)
    return {
        isDarkMode: state.globalReducer.isDarkMode,
    }
}

export default connect(mapStateToProps)(InnerCard)
