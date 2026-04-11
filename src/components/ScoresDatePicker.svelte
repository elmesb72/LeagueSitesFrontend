<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Datepicker from 'vanillajs-datepicker/Datepicker';
	import 'vanillajs-datepicker/css/datepicker.css';

	let { selectedDate, gameCounts }: { selectedDate: string; gameCounts: Record<string, number> } =
		$props();

	let monthEl: HTMLDivElement;
	let picker: Datepicker | null = null;

	function getWeekDays(dateStr: string): { date: string; label: string; day: number }[] {
		const d = new Date(dateStr + 'T12:00:00');
		const dayOfWeek = d.getDay();
		const days: { date: string; label: string; day: number }[] = [];
		for (let offset = -dayOfWeek; offset < 7 - dayOfWeek; offset++) {
			const current = new Date(d);
			current.setDate(d.getDate() + offset);
			days.push({
				date: formatDate(current),
				label: current.toLocaleDateString('en-US', { weekday: 'short' }),
				day: current.getDate()
			});
		}
		return days;
	}

	function formatDate(d: Date): string {
		return d.toISOString().split('T')[0];
	}

	function offsetWeek(dateStr: string, days: number): string {
		const d = new Date(dateStr + 'T12:00:00');
		d.setDate(d.getDate() + days);
		return formatDate(d);
	}

	function formatMonthYear(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
	}

	const weekDays = $derived(getWeekDays(selectedDate));

	$effect(() => {
		// Track selectedDate so this runs when it changes (e.g. week navigation)
		const date = selectedDate;
		if (picker) {
			picker.setDate(date);
		}
	});

	function togglePicker(): void {
		if (picker) {
			picker.destroy();
			picker = null;
		} else {
			picker = new Datepicker(monthEl, {
				todayButton: true,
				todayHighlight: true,
				format: 'yyyy-mm-dd'
			});
			// Set the picker to the currently selected date
			picker.setDate(selectedDate);
			picker.show();
			monthEl.addEventListener('changeDate', handleDateChange);
		}
	}

	function handleDateChange(): void {
		if (!picker) return;
		const d = picker.getDate();
		if (d) {
			const formatted = formatDate(d);
			goto(`/Scores?day=${formatted}`);
		}
	}

	onMount(() => {
		return () => {
			if (picker) {
				picker.destroy();
				picker = null;
			}
		};
	});
</script>

<div class="scores-date-picker">
	<div class="scores-date-picker-month" bind:this={monthEl} data-date={selectedDate}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span class="scores-date-picker-month-name" onclick={togglePicker}>
			{formatMonthYear(selectedDate)} <i class="fa-regular fa-calendar"></i>
		</span>
	</div>
	<div class="scores-date-picker-week-back">
		<a href="/Scores?day={offsetWeek(selectedDate, -7)}">&lt;</a>
	</div>
	<div class="scores-date-picker-days">
		{#each weekDays as wd}
			{@const count = gameCounts[wd.date] ?? 0}
			<a href="/Scores?day={wd.date}">
				<div
					class="scores-date-picker-day"
					class:scores-date-picker-selected-day={wd.date === selectedDate}
					class:scores-date-picker-day-no-games={count === 0}
				>
					<div class="scores-date-picker-weekday">{wd.label}</div>
					<div class="scores-date-picker-day-number">{wd.day}</div>
					<div class="scores-week-picker-day-games">
						{count}
						{count === 1 ? 'game' : 'games'}
					</div>
				</div>
			</a>
		{/each}
	</div>
	<div class="scores-date-picker-week-ahead">
		<a href="/Scores?day={offsetWeek(selectedDate, 7)}">&gt;</a>
	</div>
</div>
