<script lang="ts">
	import { navigating } from '$app/stores';
	import { fade } from 'svelte/transition';

	let { children } = $props();
	let visible = $state(true);

	$effect(() => {
		if ($navigating) {
			const from = $navigating.from?.url.pathname;
			const to = $navigating.to?.url.pathname;
			if (from !== to) {
				visible = false;
			}
		}
	});

	$effect(() => {
		if (!$navigating && !visible) {
			visible = true;
		}
	});
</script>

{#if visible}
	<div in:fade={{ duration: 150 }}>
		{@render children?.()}
	</div>
{:else}
	<div class="loading">
		<div class="diamond-container">
			<!--
				Scale: 400ft (CF) = 80 SVG units
				90ft base path = 18 units, diagonal = 25.5 units
				Home plate: (50, 97)
				1B: (62.7, 84.3)  2B: (50, 71.5)  3B: (37.3, 84.3)
				Outfield arc: radius 80 centered on home
				Foul line endpoints at 45deg: (50±56.6, 97-56.6) = (106.6, 40.4) and (-6.6, 40.4)
				Clamped to viewBox: ~(95, 47) and (~5, 47)
			-->
			<svg class="diamond" viewBox="0 35 100 67" xmlns="http://www.w3.org/2000/svg">
				<!-- Foul lines -->
				<line x1="50" y1="97" x2="96" y2="51" stroke="var(--surface-heading-secondary)" stroke-width="0.6" />
				<line x1="50" y1="97" x2="4" y2="51" stroke="var(--surface-heading-secondary)" stroke-width="0.6" />
				<!-- Outfield arc -->
				<path
					d="M 96,51 A 80 80 0 0 0 4,51"
					fill="none"
					stroke="var(--surface-heading-secondary)"
					stroke-width="0.6"
				/>
				<!-- Base paths -->
				<polygon
					points="50,71.5 62.7,84.3 50,97 37.3,84.3"
					fill="none"
					stroke="var(--surface-heading-secondary)"
					stroke-width="1.2"
				/>
				<!-- Bases -->
				<rect x="47" y="68.5" width="6" height="6" fill="var(--surface-heading-primary)" transform="rotate(45 50 71.5)" />
				<rect x="59.7" y="81.3" width="6" height="6" fill="var(--surface-heading-primary)" transform="rotate(45 62.7 84.3)" />
				<rect x="47" y="94" width="6" height="6" fill="var(--surface-heading-primary)" transform="rotate(45 50 97)" />
				<rect x="34.3" y="81.3" width="6" height="6" fill="var(--surface-heading-primary)" transform="rotate(45 37.3 84.3)" />
			</svg>
			<div class="runner"></div>
		</div>
	</div>
{/if}

<style>
	.loading {
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.diamond-container {
		position: relative;
		width: 500px;
		height: 310px;
	}

	.diamond {
		width: 100%;
		height: 100%;
	}

	.runner {
		position: absolute;
		width: 16px;
		height: 16px;
		background-color: var(--link-default);
		border-radius: 50%;
		animation: run-bases 1.2s linear infinite;
	}

	@keyframes run-bases {
		0%  { left: calc(50% - 8px);   top: calc(92.5% - 8px); }
		25% { left: calc(62.7% - 8px); top: calc(73.6% - 8px); }
		50% { left: calc(50% - 8px);   top: calc(54.5% - 8px); }
		75% { left: calc(37.3% - 8px); top: calc(73.6% - 8px); }
		100% { left: calc(50% - 8px);  top: calc(92.5% - 8px); }
	}
</style>
