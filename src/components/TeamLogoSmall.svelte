<script lang="ts">
	import { existsSync } from "fs";

	let { team } = $props();

    const logoPath = `src/lib/assets/images/teams/${team.id}-sm.webp`
    const fileExists = existsSync(logoPath);
</script>

{#if fileExists}
    <img src="{logoPath}" alt="Team"/>
{:else}
    <div style="height: 24px; width: 24px; border-radius: 14px; background-color: #{team.backgroundColor} !important; border: 2px solid black; color: #{team.color} !important; line-height: 24px !important; text-align: center; font-size: 16px;">{team.abbreviation.charAt(0)}</div>
{/if}
