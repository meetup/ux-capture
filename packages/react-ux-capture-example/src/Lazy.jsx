import React from 'react';
import Inline from './marks/Inline';

export default class Lazy extends React.Component {
	constructor(props) {
		super(props);
		this.state = { loaded: false };
	}
	componentDidMount() {
		this.timeout = setTimeout(
			() => this.setState({ loaded: true }),
			this.props.delay
		);
	}
	componentWillUnmount() {
		clearTimeout(this.timeout);
	}
	render() {
		if (!this.state.loaded) {
			return null;
		}
		return (
			<div>
				This was loaded lazily in {this.props.delay}ms
				<Inline mark={this.props.mark} />
			</div>
		);
	}
}