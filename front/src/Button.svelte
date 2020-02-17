<script>
	export let id = undefined;
	export let element = undefined;
	export let text = '';
	export let x = 0;
	export let y = 0;
	export let w = undefined;
	export let v = true;

	x = x * 12;
	y = y * 34;

	let width = 'auto';
	if (w !== undefined) {
		width = (w * 12) + 'px'
	}
</script>

<style>
	button {
		font-size: 2em;
		font-family: inherit;
		position: absolute;
		background-color: var(--eleeColorDark2);;
		color: var(--eleeColorLight2);
		border: 2px solid var(--eleeColorLight1);
		border-radius: 6px;
		height: 30px;
		margin: 2px 0px 2px 0px;
		box-sizing: border-box;
		padding: 0px 4px 0px 4px;
	}

	button:focus {
		outline: none;
		/* color: var(--eleeColorLight2); */
		border-bottom-color: var(--eleeColorLight2);
		/* border-left-color: var(--eleeColorLight3);
		border-right-color: var(--eleeColorLight3); */
		/* border-color: var(--eleeColorLight3); */
	}

	button:active {
		border-color: var(--eleeColorLight2);
		background-color: var(--eleeColorLight2);
		color: var(--eleeColorDark3);
		/* border-bottom-color: var(--eleeColorLight3); */
		/* border-top-color: var(--eleeColorLight3); */
		/* border-right-color: var(--eleeColorLight3); */
		/* border-left-color: var(--eleeColorLight3); */
	}
</style>

<!-- <svelte:options accessors/> -->

<button id="{id}" class="elee-button" on:click bind:this={element}
	style="left: {x}px; top: {y}px; width: {width}; visibility: { v ? 'visible' : 'hidden' }">
	{text}
</button>