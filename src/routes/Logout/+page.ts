export const load = async ({ fetch }) => {
	try {
		await fetch('/api/User/Logout', { method: 'POST' });
	} catch {
		// Ignore — we redirect regardless
	}
	return { redirect: '/' };
};
