interface LoginProvider {
	name: string;
	url: string;
}

export const load = async ({ fetch, url, parent }) => {
	const error = url.searchParams.get('error');
	const errorDetails = url.searchParams.get('error_details');

	// Redirect if already authenticated
	const { user } = await parent();
	if (user.isAuthenticated) {
		return { redirect: '/User', providers: [], isDevelopment: false, errorMessage: '' };
	}

	let errorMessage = '';
	if (error) {
		switch (error) {
			case 'invitation':
				errorMessage = `The email address "${errorDetails ?? '(not provided)'}" is not associated with any valid invitations. Please contact your manager.`;
				break;
			case 'token':
				errorMessage = `There was an error getting your profile data from the provider: ${errorDetails ?? 'No error info was provided.'}`;
				break;
			case 'code':
				errorMessage = `There was an error on the provider's end: ${errorDetails ?? 'No error info was provided.'}`;
				break;
			case 'user':
				errorMessage = 'Login failed: You did not allow access to the site.';
				break;
			default:
				errorMessage = 'Unknown error. Are you messing around with the URL?';
		}
	}

	try {
		const response = await fetch('/api/Login');
		if (!response.ok) {
			return { redirect: null, providers: [] as LoginProvider[], isDevelopment: false, errorMessage };
		}

		const data = await response.json();
		return {
			redirect: null,
			providers: data.providers as LoginProvider[],
			isDevelopment: data.isDevelopment as boolean,
			errorMessage
		};
	} catch {
		console.error('Failed to fetch login config. Is the backend available?');
		return { redirect: null, providers: [] as LoginProvider[], isDevelopment: false, errorMessage };
	}
};
