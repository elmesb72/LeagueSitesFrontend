<script lang="ts">
	import './+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import EasyMDE from 'easymde';
	import 'easymde/dist/easymde.min.css';

	let { data } = $props();
	const createData = $derived(data.createData);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	let authorInvitationId = $state(0);
	let title = $state('');
	let isHidden = $state(false);
	let saving = $state(false);
	let editorEl: HTMLTextAreaElement;
	let mde: EasyMDE | null = null;

	function initForm(): void {
		if (!createData) return;
		authorInvitationId = createData.invitations[0]?.id ?? 0;
	}

	async function createPost(): Promise<void> {
		if (saving) return;
		const contents = mde?.value() ?? '';
		if (!title.trim() || !contents.trim()) {
			alert('Title and contents are required.');
			return;
		}
		saving = true;

		const response = await fetch('/api/News', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				authorInvitationID: authorInvitationId,
				title,
				contents,
				isHidden
			})
		});

		saving = false;
		if (response.ok) {
			goto('/', { invalidateAll: true });
		} else {
			alert(await response.text());
		}
	}

	onMount(() => {
		if (data.redirect) {
			goto(data.redirect);
			return;
		}
		initForm();
		mde = new EasyMDE({
			element: editorEl,
			toolbar: ['bold', 'italic', 'strikethrough', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', '|', 'undo', 'redo', '|', 'guide'],
		});
	});
</script>

<svelte:head>
	<title>{shortName} » New News Post</title>
</svelte:head>

{#if createData}
	<div class="row">
		<div class="section news-edit">
			<h1>New News Post</h1>
			<div class="news-edit-form">
				<div class="news-edit-field">
					<label for="author">Posting on behalf of...</label>
					<select id="author" bind:value={authorInvitationId}>
						{#each createData.invitations as inv}
							<option value={inv.id}>{inv.teamName}</option>
						{/each}
					</select>
				</div>
				<div class="news-edit-field">
					<label for="title">Title</label>
					<input type="text" id="title" bind:value={title} />
				</div>
				<div class="news-edit-field">
					<textarea bind:this={editorEl}></textarea>
				</div>
				<div class="news-edit-footer">
					<div class="news-edit-submit">
						<button class="news-edit-btn" onclick={createPost} disabled={saving}>
							{saving ? 'Creating...' : 'Create'}
						</button>
						<button class="news-edit-btn-cancel" onclick={() => goto('/')}>Cancel</button>
					</div>
					<div class="news-edit-checkboxes">
						<label><input type="checkbox" bind:checked={isHidden} /> Hidden</label>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
