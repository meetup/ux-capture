import ExpectedMark from './ExpectedMark';

/**
 * A `Zone` is a collection of DOM elements on a page that correspond
 * to a given phase of page load. (e.g. all elements in `ux-destination-verfied`)
 *
 * Example props:
 *
 * {
 *  name: "ux-destination-verified",
 *  marks: ["ux-image-online-logo", "ux-image-inline-logo"]
 * }
 */
function Zone(props) {
	this.props = props;

	// Tell ExpectedMark to check for completion of this set of mark names
	ExpectedMark.addMarkSet(this.props.marks, this.measure.bind(this));
}

/**
 * Records measure on Performance Timeline and calls onMeasure callback
 *
 * @param {String} lastMark last mark that triggered completion
 */
Zone.prototype.measure = function(endMarkName) {
	if (this.measured) {
		// only need to respond to first call of zone.measure - subsequent calls allowed but ignored
		return;
	}

	const { name, startMarkName } = this.props;
	if (
		typeof window.performance !== 'undefined' &&
		typeof window.performance.measure !== 'undefined'
	) {
		// check if 'end mark' was recorded before start mark - if so, end should
		// be same as start (measured time is 0)
		const endMark = window.performance.getEntriesByName(endMarkName, 'mark');
		const startMark = window.performance.getEntriesByName(startMarkName, 'mark');
		if (endMark.startTime < startMark.startTime) {
			endMarkName = startMarkName;
		}
		window.performance.measure(name, startMarkName, endMarkName);
	}

	this.measured = true;
	Zone.onMeasure(name);
};

Zone.prototype.destroy = function() {
	if (
		typeof window.performance !== 'undefined' &&
		typeof window.performance.measure !== 'undefined'
	) {
		window.performance.clearMeasures(this.props.name);
	}

	ExpectedMark.removeMarkSet(this.props.marks);
	this.marks = null;
};

export default Zone;
