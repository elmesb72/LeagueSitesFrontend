import { render } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import HomepageInformationIcon from './HomepageInformationIcon.svelte';

describe('HomepageInformationIcon', () => {
	test('renders PDF icon for .pdf href', () => {
		const { container } = render(HomepageInformationIcon, { props: { href: '/docs/rules.pdf' } });
		expect(container.querySelector('.fa-file-pdf')).not.toBeNull();
	});

	test('renders Word icon for .doc href', () => {
		const { container } = render(HomepageInformationIcon, { props: { href: '/docs/roster.doc' } });
		expect(container.querySelector('.fa-file-word')).not.toBeNull();
	});

	test('renders Word icon for .docx href', () => {
		const { container } = render(HomepageInformationIcon, { props: { href: '/docs/roster.docx' } });
		expect(container.querySelector('.fa-file-word')).not.toBeNull();
	});

	test('renders nothing for unknown extension', () => {
		const { container } = render(HomepageInformationIcon, { props: { href: '/page/about' } });
		expect(container.querySelector('i')).toBeNull();
	});

	test('renders nothing for .html href', () => {
		const { container } = render(HomepageInformationIcon, { props: { href: '/info/rules.html' } });
		expect(container.querySelector('i')).toBeNull();
	});
});
