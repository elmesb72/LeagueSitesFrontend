import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import UserPage from './+page.svelte';
import type { UserProfileData } from '$lib/models/UserProfile';
import { mockTeamA, mockTeamB } from '../../tests/mocks';

const mockProfile: UserProfileData = {
	user: {
		id: 1,
		userRoles: [{ role: { name: 'Webmaster' } }],
		userLogins: [
			{
				id: 10,
				name: 'John Doe',
				email: 'john@example.com',
				isPrimary: true,
				loginSource: { id: 1, source: 'Google' }
			},
			{
				id: 11,
				name: 'John D',
				email: 'johnd@outlook.com',
				isPrimary: false,
				loginSource: { id: 2, source: 'Microsoft' }
			}
		],
		invitations: [
			{
				id: 100,
				team: mockTeamA,
				player: { id: 50, name: 'John Doe', shortCode: 'doejo01' },
				status: { name: 'Active' },
				invitationRoles: [{ role: { name: 'Manager' } }]
			},
			{
				id: 101,
				team: mockTeamB,
				player: null,
				status: { name: 'Active' },
				invitationRoles: [{ role: { name: 'Scorer' } }]
			}
		]
	},
	hasDeletedNews: true
};

const baseData = {
	redirect: null,
	profile: mockProfile,
	providers: [{ name: 'Google', url: 'https://google.com/auth' }],
	error: '',
	siteConfig: { siteName: 'Test League', shortName: 'TL', home: { aboutBlurb: '', executives: {}, socials: {}, links: {}, information: {} }, apiKeys: { googleMaps: '' } },
	user: { isAuthenticated: true, name: 'John Doe', claims: [] }
};

describe('User Page', () => {
	test('renders profile heading', () => {
		render(UserPage, { props: { data: baseData } });
		expect(screen.getByText('Your Profile')).toBeInTheDocument();
	});

	test('renders webmaster role section', () => {
		render(UserPage, { props: { data: baseData } });
		expect(screen.getByText('Webmaster')).toBeInTheDocument();
		expect(screen.getByText('Site Administration')).toBeInTheDocument();
	});

	test('renders executive role when user is executive', () => {
		const execData = {
			...baseData,
			profile: {
				...mockProfile,
				user: { ...mockProfile.user, userRoles: [{ role: { name: 'Executive' } }] }
			}
		};
		render(UserPage, { props: { data: execData } });
		expect(screen.getByText('League Executive')).toBeInTheDocument();
	});

	test('renders team invitations', () => {
		render(UserPage, { props: { data: baseData } });
		expect(screen.getByText('Springfield Isotopes')).toBeInTheDocument();
		expect(screen.getByText('Shelbyville Sharks')).toBeInTheDocument();
	});

	test('renders Teams plural when multiple invitations', () => {
		render(UserPage, { props: { data: baseData } });
		expect(screen.getByText('Teams')).toBeInTheDocument();
	});

	test('renders Team singular when one invitation', () => {
		const singleTeam = {
			...baseData,
			profile: {
				...mockProfile,
				user: { ...mockProfile.user, invitations: [mockProfile.user.invitations[0]] }
			}
		};
		render(UserPage, { props: { data: singleTeam } });
		expect(screen.getByText('Team')).toBeInTheDocument();
	});

	test('renders player link when invitation has player', () => {
		render(UserPage, { props: { data: baseData } });
		const playerLink = screen.getByText('John Doe');
		expect(playerLink.closest('a')?.getAttribute('href')).toBe('/Player/doejo01');
	});

	test('renders manager icon for manager role', () => {
		const { container } = render(UserPage, { props: { data: baseData } });
		expect(container.querySelector('.fa-users')).not.toBeNull();
	});

	test('renders scorer icon for scorer role', () => {
		const { container } = render(UserPage, { props: { data: baseData } });
		expect(container.querySelector('.fa-clipboard-list')).not.toBeNull();
	});

	test('renders deleted news link when hasDeletedNews', () => {
		render(UserPage, { props: { data: baseData } });
		expect(screen.getByText('View/restore deleted News posts')).toBeInTheDocument();
	});

	test('hides deleted news link when no deleted news', () => {
		const noNews = { ...baseData, profile: { ...mockProfile, hasDeletedNews: false } };
		render(UserPage, { props: { data: noNews } });
		expect(screen.queryByText('View/restore deleted News posts')).toBeNull();
	});

	test('renders existing logins with provider icons', () => {
		const { container } = render(UserPage, { props: { data: baseData } });
		const loginImages = container.querySelectorAll('.user-login-source img');
		expect(loginImages.length).toBe(2);
	});

	test('primary login shows star icon', () => {
		const { container } = render(UserPage, { props: { data: baseData } });
		expect(container.querySelector('.fa-star')).not.toBeNull();
	});

	test('non-primary login shows action buttons', () => {
		const { container } = render(UserPage, { props: { data: baseData } });
		expect(container.querySelector('.fa-trash-alt')).not.toBeNull();
		expect(container.querySelector('.fa-star')).not.toBeNull();
	});

	test('renders login details with name and email', () => {
		render(UserPage, { props: { data: baseData } });
		expect(screen.getByText('John Doe (john@example.com)')).toBeInTheDocument();
		expect(screen.getByText('John D (johnd@outlook.com)')).toBeInTheDocument();
	});

	test('renders add other accounts section', () => {
		render(UserPage, { props: { data: baseData } });
		expect(screen.getByText('Add Other Accounts')).toBeInTheDocument();
		expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
	});

	test('renders logout link', () => {
		render(UserPage, { props: { data: baseData } });
		const logoutLink = screen.getByText('Click here to log out!');
		expect(logoutLink.closest('a')?.getAttribute('href')).toBe('/Logout');
	});

	test('shows error when present', () => {
		const errorData = { ...baseData, error: 'Something went wrong' };
		render(UserPage, { props: { data: errorData } });
		expect(screen.getByText('Something went wrong')).toBeInTheDocument();
	});

	test('does not show error section when no error', () => {
		const { container } = render(UserPage, { props: { data: baseData } });
		expect(container.querySelector('.login-error')).toBeNull();
	});
});
