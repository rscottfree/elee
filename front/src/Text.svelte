<script>
	export let text = '';
	export let id = undefined;
	export let x = 0;
	export let y = 0;
	export let v = true;

	$: xpx = x * 12;
	$: ypx = y * 34;
</script>

<style>
	div {
		position: absolute;
		font-size: 2em;
		font-family: inherit;
		background-color: inherit;
		/* line-height: 1.6em; */
		line-height: 34px;
		height: 34px;
		box-sizing: border-box;
	}
</style>

<svelte:options accessors/>

<div id="{id}" class="elee-text" style="left: {xpx}px; top: {ypx}px; visibility: { v ? 'visible' : 'hidden' }">{text}</div>