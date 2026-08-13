export const load = async ({ parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login' };
	}
	return { redirect: null };
};
