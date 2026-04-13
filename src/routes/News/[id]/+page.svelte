<script lang="ts">
	import '../+page.css';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import EasyMDE from 'easymde';
	import 'easymde/dist/easymde.min.css';

	let { data } = $props();
	const newsData = $derived(data.newsData);
	const shortName = $derived(data.siteConfig?.shortName ?? '');

	let authorInvitationId = $state(0);
	let title = $state('');
	let isHidden = $state(false);
	let isDeleted = $state(false);
	let saving = $state(false);
	let editorEl: HTMLTextAreaElement;
	let mde: EasyMDE | null = null;

	function initForm(): void {
		if (!newsData?.news) return;
		authorInvitationId = newsData.news.authorInvitationId;
		title = newsData.news.title;
		isHidden = newsData.news.isHidden;
	}

	async function savePost(): Promise<void> {
		if (saving || !newsData?.news) return;
		const contents = mde?.value() ?? '';
		if (!title.trim() || !contents.trim()) {
			alert('Title and contents are required.');
			return;
		}
		saving = true;

		const response = await fetch(`/api/News/${newsData.news.id}`, {
			method: 'PUT',
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

	async function deletePost(): Promise<void> {
		if (!newsData?.news) return;
		if (!confirm('Are you sure you want to delete this post?')) return;

		const response = await fetch(`/api/News/${newsData.news.id}`, { method: 'DELETE' });
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
			initialValue: newsData?.news?.contents ?? ''
		});
	});
</script>

<svelte:head>
	<title>{shortName} » Edit News Post</title>
</svelte:head>

{#if newsData}
	<div class="row">
		<div class="section news-edit">
			<h1>Edit News Post</h1>
			<div class="news-edit-form">
				<div class="news-edit-field">
					<label for="author">Posting on behalf of...</label>
					<select id="author" bind:value={authorInvitationId}>
						{#each newsData.invitations ?? [] as inv}
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
						<button class="news-edit-btn" onclick={savePost} disabled={saving}>
							{saving ? 'Saving...' : 'Update'}
						</button>
						<button class="news-edit-btn-cancel" onclick={() => goto('/')}>Cancel</button>
					</div>
					<div class="news-edit-checkboxes">
						<label><input type="checkbox" bind:checked={isHidden} /> Hidden</label>
						<button class="news-edit-btn-delete" onclick={deletePost}>
							<i class="fas fa-trash"></i> Delete
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
