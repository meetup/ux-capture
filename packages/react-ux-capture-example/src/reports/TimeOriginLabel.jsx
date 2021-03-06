import React from 'react';

import TimeLabel from './TimeLabel';

const TimeOriginLabel = props => {
	const { time } = props;

	return (
		<TimeLabel
			time={Math.round(time)}
			title="Moment of navigationStart in page view mode or intractive transitionStart in SPA mode"
			icon="🎬"
		/>
	);
};

export default TimeOriginLabel;
