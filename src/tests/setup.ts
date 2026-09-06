import '@testing-library/jest-dom/vitest';

// jsdom does not implement the Web Animations API, which svelte's
// animate:flip (used with dnd lists) calls on list changes. Stub just
// enough for components using it to render and update in tests.
if (typeof Element !== 'undefined' && !Element.prototype.getAnimations) {
	Element.prototype.getAnimations = () => [];
}
if (typeof Element !== 'undefined' && !Element.prototype.animate) {
	Element.prototype.animate = () =>
		({
			cancel: () => {},
			finish: () => {},
			finished: Promise.resolve(),
			onfinish: null
		}) as unknown as Animation;
}
