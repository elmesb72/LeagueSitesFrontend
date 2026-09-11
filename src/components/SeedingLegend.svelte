<!-- Colour key for the seeding board's connectors. Each state also has a text tag
     on its seed slot, so colour is never the only carrier of meaning. -->
<ul class="seeding-legend" aria-label="What the connector colours mean">
	<li><span class="seeding-legend-swatch line-default"></span> default order</li>
	<li>
		<span class="seeding-legend-swatch line-shifted"></span> moved up because a team above is sitting
		out
	</li>
	<li><span class="seeding-legend-swatch line-override"></span> changed by hand</li>
	<li><span class="seeding-legend-swatch line-other"></span> from another source</li>
</ul>

<style>
	.seeding-legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-5);
		list-style: none;
		padding: 0;
		margin: 0 0 var(--space-3);
		font-size: var(--text-sm);
		color: var(--text-soft-contrast);
	}

	.seeding-legend li {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.seeding-legend-swatch {
		display: inline-block;
		width: 26px;
		border-top: 3px solid var(--text-soft);
	}

	.line-shifted {
		border-top-color: var(--color-olive);
	}

	.line-override {
		border-top-color: var(--color-copper);
	}

	.line-other {
		border-top-color: var(--color-tan);
		border-top-style: dashed;
	}
</style>
