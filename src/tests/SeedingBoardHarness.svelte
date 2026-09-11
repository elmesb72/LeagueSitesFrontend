<script lang="ts">
	// Test-only host for TournamentSeedingBoard: binds `seeding` the way the real
	// forms do and exposes what the board writes back, so tests can assert on the
	// rules produced rather than only on rendering.
	import { untrack, type ComponentProps } from 'svelte';
	import type { SeedGroup } from '$lib/models/Tournament';
	import TournamentSeedingBoard from '../components/TournamentSeedingBoard.svelte';

	let { seeding: initial, ...rest }: ComponentProps<typeof TournamentSeedingBoard> = $props();

	// Deliberate one-time capture, like the forms.
	// svelte-ignore state_referenced_locally
	let seeding = $state<SeedGroup[]>(initial);
	let board = $state<TournamentSeedingBoard | null>(null);

	/** How many times the board has replaced `seeding` since mount (0 = untouched). */
	let writes = $state(-1);
	$effect(() => {
		void seeding;
		untrack(() => writes++);
	});

	export function current(): SeedGroup[] {
		return $state.snapshot(seeding);
	}

	export function problems(): string[] {
		return board?.validationProblems() ?? [];
	}
</script>

<TournamentSeedingBoard bind:this={board} bind:seeding {...rest} />
<pre data-testid="seeding">{JSON.stringify(seeding)}</pre>
<span data-testid="writes">{writes}</span>
