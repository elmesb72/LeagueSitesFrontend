export const load = async ({ params, parent }) => {
	const { user } = await parent();
	if (!user.isAuthenticated) {
		return { redirect: '/Login', seasonId: 0 };
	}
	return { redirect: null, seasonId: Number(params.seasonId) };
};
