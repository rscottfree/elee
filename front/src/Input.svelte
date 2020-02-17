<script>
	export let text = '';
	export let id = undefined;
	export let x = 0;
	export let y = 0;
	export let w = 0;

	$: maxLength = w - 3;
	$: textin = ((text || '').length > maxLength) ? text = (text || '').slice(0, maxLength) : text || '';

	$: wpx = w * 12;
	$: xpx = x * 12;
	$: ypx = y * 34;
</script>

<style>
	input {
		font-size: 2em;
		position: absolute;
		/* background-color: inherit; */
		color: var(--eleeColorLight3);
		/* border: 2px solid var(--eleeColorLight1); */
		border: none;
		font-family: inherit;
		background-color: var(--eleeColorDark2);
		/* border-radius: 6px; */
		height: 30px;
		line-height: 30px;
		box-sizing: border-box;
		padding: 0px 12px;
		/* padding-right: 12px; */
		margin: 2px 0px;
	}

	input:focus {
		outline: none;
		/* color: var(--eleeColorLight2); */
		border-bottom-color: var(--eleeColorLight3);
		/* border-left-color: var(--eleeColorLight3); */
		/* border-right-color: var(--eleeColorLight3); */
	}

	input:active {
		border-color: var(--eleeColorLight2);
	}

	.elee-input-arrow {
		position: absolute;
		width: 0;
		height: 0;
		margin-top: 2px;
		border-top: 15px solid transparent;
		border-bottom: 15px solid transparent;
		border-left: 13px solid var(--eleeColorLight1);
	}

	.elee-input-arrow-container {
		position: absolute;
		background-color: var(--eleeColorDark2);
		width: 12px;
		height: 30px;
		margin-top: 2px;
	}

	.elee-input-container:focus-within .elee-input-arrow {
		border-left-color: var(--eleeColorLight2);
	}
</style>

<!-- <svelte:options accessors/> -->

<div class="elee-input-container">
<input id="{id}" class="elee-input" bind:value={textin}
	style="left: {xpx + 12}px; top: {ypx}px; width: {wpx-12}px;" maxlength="{maxLength}" />

<div class="elee-input-arrow-container" style="left: {xpx}px; top: {ypx}px;"></div>
<div class="elee-input-arrow" style="left: {xpx}px; top: {ypx}px;"></div>
</div>