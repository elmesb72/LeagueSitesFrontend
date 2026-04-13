<script lang="ts">
	let { value = $bindable(''), disabled = false }: { value?: string; disabled?: boolean } = $props();

	let tags = $state<string[]>([]);
	let inputValue = $state('');
	let internalUpdate = false;

	$effect(() => {
		if (!internalUpdate && value) {
			tags = value.split(',').map((t) => t.trim()).filter(Boolean);
		}
		internalUpdate = false;
	});

	function syncValue(): void {
		internalUpdate = true;
		value = tags.join(',');
	}

	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	function addTag(): void {
		const trimmed = inputValue.trim();
		if (trimmed && !tags.includes(trimmed)) {
			if (!isValidEmail(trimmed)) {
				return;
			}
			tags = [...tags, trimmed];
			syncValue();
		}
		inputValue = '';
	}

	function removeTag(index: number): void {
		tags = tags.filter((_, i) => i !== index);
		syncValue();
	}

	function handleKeydown(e: KeyboardEvent): void {
		if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
			e.preventDefault();
			addTag();
		}
		if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
			removeTag(tags.length - 1);
		}
	}

	function handleBlur(): void {
		if (inputValue.trim()) {
			addTag();
		}
	}
</script>

<div class="tag-input" class:tag-input-disabled={disabled}>
	{#each tags as tag, i}
		<span class="tag">
			{tag}
			{#if !disabled}
				<button class="tag-remove" onclick={() => removeTag(i)}>&times;</button>
			{/if}
		</span>
	{/each}
	{#if !disabled}
		<input
			type="text"
			class="tag-input-field"
			bind:value={inputValue}
			onkeydown={handleKeydown}
			onblur={handleBlur}
			placeholder={tags.length === 0 ? 'Type and press Enter or Tab' : ''}
		/>
	{/if}
</div>

<style>
	.tag-input {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		padding: 3px;
		border: 1px solid #d0d0d0;
		border-radius: 3px;
		min-height: 28px;
		align-items: center;
		background: white;
	}

	.tag-input-disabled {
		opacity: 0.6;
		background: #f5f5f5;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		background: var(--surface-heading-secondary);
		color: var(--text-inverted);
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 13px;
	}

	.tag-remove {
		background: none;
		border: none;
		color: var(--text-inverted);
		cursor: pointer;
		padding: 0 0 0 4px;
		font-size: 14px;
		line-height: 1;
	}

	.tag-input-field {
		border: none;
		outline: none;
		flex: 1;
		min-width: 80px;
		font: inherit;
		padding: 2px;
	}
</style>
