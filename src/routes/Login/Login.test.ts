import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import LoginPage from './+page.svelte';

const mockProviders = [
	{ name: 'Google', url: 'https://accounts.google.com/o/oauth2/v2/auth?test=1' },
	{ name: 'Microsoft', url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?test=1' }
];

describe('Login Page', () => {
	test('renders provider heading', () => {
		render(LoginPage, { props: { data: { redirect: null, providers: mockProviders, errorMessage: '' } } });
		expect(screen.getByText('Select a Provider')).toBeInTheDocument();
	});

	test('renders privacy policy', () => {
		render(LoginPage, { props: { data: { redirect: null, providers: mockProviders, errorMessage: '' } } });
		expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
	});

	test('renders provider links', () => {
		render(LoginPage, { props: { data: { redirect: null, providers: mockProviders, errorMessage: '' } } });
		expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
		expect(screen.getByText('Sign in with Microsoft')).toBeInTheDocument();
	});

	test('provider links have correct URLs', () => {
		render(LoginPage, { props: { data: { redirect: null, providers: mockProviders, errorMessage: '' } } });
		const googleLink = screen.getByText('Sign in with Google').closest('a');
		expect(googleLink?.getAttribute('href')).toContain('accounts.google.com');
	});

	test('renders provider images', () => {
		const { container } = render(LoginPage, { props: { data: { redirect: null, providers: mockProviders, errorMessage: '' } } });
		const images = container.querySelectorAll('.oauth-provider-image img');
		expect(images.length).toBe(2);
	});

	test('shows no-providers message when empty', () => {
		render(LoginPage, { props: { data: { redirect: null, providers: [], errorMessage: '' } } });
		expect(screen.getByText(/No authentication providers have been configured/)).toBeInTheDocument();
	});

	test('shows error message when present', () => {
		render(LoginPage, { props: { data: { redirect: null, providers: mockProviders, errorMessage: 'Login failed: You did not allow access to the site.' } } });
		expect(screen.getByText('Error')).toBeInTheDocument();
		expect(screen.getByText('Login failed: You did not allow access to the site.')).toBeInTheDocument();
	});

	test('does not show error section when no error', () => {
		const { container } = render(LoginPage, { props: { data: { redirect: null, providers: mockProviders, errorMessage: '' } } });
		expect(container.querySelector('.login-error')).toBeNull();
	});

	test('renders invitation error with email', () => {
		const msg = 'The email address "test@example.com" is not associated with any valid invitations. Please contact your manager.';
		render(LoginPage, { props: { data: { redirect: null, providers: [], errorMessage: msg } } });
		expect(screen.getByText(msg)).toBeInTheDocument();
	});
});
