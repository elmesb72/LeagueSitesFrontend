import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import HomepageNews from './HomepageNews.svelte';
import { mockNews, mockHiddenNews } from '../tests/mocks';

describe('HomepageNews', () => {
	test('renders news post with title and content', () => {
		render(HomepageNews, { props: { news: mockNews } });
		expect(screen.getByText('Season Opener Recap')).toBeInTheDocument();
		expect(screen.getByText('Great game last night!')).toBeInTheDocument();
	});

	test('renders author name', () => {
		render(HomepageNews, { props: { news: mockNews } });
		expect(screen.getByText('John Doe')).toBeInTheDocument();
	});

	test('renders date', () => {
		render(HomepageNews, { props: { news: mockNews } });
		expect(screen.getByText('Apr 8, 2026')).toBeInTheDocument();
	});

	test('renders edited date when available', () => {
		const editedNews = { ...mockNews, edited: '2026-04-09T14:00:00' };
		render(HomepageNews, { props: { news: editedNews } });
		expect(screen.getByText('Apr 9, 2026')).toBeInTheDocument();
	});

	test('shows edit link when canEdit is true', () => {
		render(HomepageNews, { props: { news: mockNews, canEdit: true } });
		const editLink = screen.getByRole('link', { name: /Apr 8, 2026/ });
		expect(editLink).toHaveAttribute('href', '/News/201');
	});

	test('does not show edit link when canEdit is false', () => {
		render(HomepageNews, { props: { news: mockNews, canEdit: false } });
		const links = screen.queryAllByRole('link');
		const editLink = links.find((l) => l.getAttribute('href')?.startsWith('/News/'));
		expect(editLink).toBeUndefined();
	});

	test('shows hidden disclaimer for hidden posts', () => {
		render(HomepageNews, { props: { news: mockHiddenNews } });
		expect(screen.getByText(/This post \(authored by you\) is hidden/)).toBeInTheDocument();
	});

	test('does not show hidden disclaimer for visible posts', () => {
		render(HomepageNews, { props: { news: mockNews } });
		expect(screen.queryByText(/This post \(authored by you\) is hidden/)).toBeNull();
	});
});
