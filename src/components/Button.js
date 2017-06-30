import React, { PureComponent } from 'react';
import classNames from 'classnames';

class Button extends PureComponent {
    render() {
        return (
            <button className={classNames(this.props.className)} onClick={this.props.onClick}>
                {this.props.text}
            </button>
        );
    }
}

export default Button