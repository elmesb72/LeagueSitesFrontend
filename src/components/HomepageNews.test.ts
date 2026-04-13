import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import HomepageNews from './HomepageNews.svelte';
import { mockNews, mockHiddenNews } from '../tests/mocks';

describe('HomepageNews', () => {
	test('renders author name and title', () => {
		render(HomepageNews, { props: { news: mockNews } });
		expect(screen.getByText('John Doe')).toBeInTheDocument();
		expect(screen.getByText('Season Opener Recap')).toBeInTheDocument();
	});

	test('renders post contents as HTML', () => {
		render(HomepageNews, { props: { news: mockNews } });
		expect(screen.getByText('Great game last night!')).toBeInTheDocument();
	});

	test('renders formatted date', () => {
		render(HomepageNews, { props: { news: mockNews } });
		expect(screen.getByText('Apr 8, 2026')).toBeInTheDocument();
	});

	test('renders edited date when present', () => {
		const editedNews = { ...mockNews, edited: '2026-04-10T14:00:00' };
		render(HomepageNews, { props: { news: editedNews } });
		expect(screen.getByText('Apr 10, 2026')).toBeInTheDocument();
	});

	test('hidden post shows disclaimer', () => {
		render(HomepageNews, { props: { news: mockHiddenNews } });
		expect(screen.getByText(/This post.*is hidden/)).toBeInTheDocument();
	});

	test('hidden post has hidden CSS class', () => {
		const { container } = render(HomepageNews, { props: { news: mockHiddenNews } });
		expect(container.querySelector('.home-news-hidden')).not.toBeNull();
	});

	test('visible post does not have hidden CSS class', () => {
		const { container } = render(HomepageNews, { props: { news: mockNews } });
		expect(container.querySelector('.home-news-hidden')).toBeNull();
	});

	test('edit link shown when canEdit is true', () => {
		render(HomepageNews, { props: { news: mockNews, canEdit: true } });
		const link = screen.getByRole('link');
		expect(link).toHaveAttribute('href', '/News/201');
	});

	test('no edit link when canEdit is false', () => {
		render(HomepageNews, { props: { news: mockNews } });
		expect(screen.queryByRole('link')).toBeNull();
	});
});

	test('renders renderedContents when provided', () => {
		render(HomepageNews, { props: { news: mockNews, renderedContents: '<p>Rendered HTML</p>' } });
		expect(screen.getByText('Rendered HTML')).toBeInTheDocument();
	});

	test('falls back to raw contents when renderedContents is empty', () => {
		render(HomepageNews, { props: { news: mockNews, renderedContents: '' } });
		expect(screen.getByText('Great game last night!')).toBeInTheDocument();
	});

	test('deleted post shows deleted disclaimer', () => {
		render(HomepageNews, { props: { news: mockNews, isDeleted: true } });
		expect(screen.getByText(/has been deleted/)).toBeInTheDocument();
	});

	test('deleted post does not show hidden disclaimer', () => {
		render(HomepageNews, { props: { news: mockHiddenNews, isDeleted: true } });
		expect(screen.queryByText(/is hidden/)).toBeNull();
		expect(screen.getByText(/has been deleted/)).toBeInTheDocument();
	});
