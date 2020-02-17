<script>
	export let id = undefined;
	export let text = '';
	export let x = 0;
	export let y = 0;
	export let w = undefined;
	export let h = '1.3em';

	x = x * 12;
	y = y * 34;

	export let width = 'auto';
	if (w !== undefined) {
		width = w + 'px'
	}
</script>

<style>
	a {
		font-size: 2em;
		font-family: inherit;
		/* line-height: 1.6em; */
		line-height: 34px;
		position: absolute;
		background-color: inherit;
		color: var(--eleeColorLight1);
	}

	a:focus {
		outline: none;
		/* color: var(--eleeColorLight2); */
		/* border-bottom: 2px solid var(--eleeColorLight2); */
		/* border-color: var(--eleeColorLight2); */
		text-decoration: underline;
		text-decoration-color: var(--eleeColorLight2);
	}

	a:active {
		color: var(--eleeColorLight2);
	}
</style>

<!-- <svelte:options accessors/> -->

<a id="{id}" class="elee-link" on:click href="."
	style="left: {x}px; top: {y}px; width: {width}; height: {h}px;">
	{text}
</a>