<script lang="ts">
	let { href }: { href: string } = $props();

	const extension = href.split('.').pop();
</script>

{#if extension === 'pdf'}
	<i class="fas fa-file-pdf"></i>
{:else if extension === 'doc' || extension === 'docx'}
	<i class="fas fa-file-word"></i>
{/if}
