<script>
	export let id = undefined;
	export let x = 0;
	export let y = 0;
	export let w = 0;
	export let h = 0;
	export let text = '';
	export let v = true;

	$: xpx = x * 12;
	$: ypx = y * 34;
	$: wpx = w * 12;
	$: hpx = h * 34;
</script>

<style>
	div {
		position: absolute;
		font-size: 2em;
		font-family: inherit;
		background-color: inherit;
		line-height: 34px;
		height: 34px;
		box-sizing: border-box;
		overflow: hidden;
		white-space: normal;
	}
</style>

<svelte:options accessors/>

<div id="{id}" class="elee-text-block"
	style="left: {xpx}px; top: {ypx}px; width: {wpx + 0.04}px; height: {hpx}px; visibility: { v ? 'visible' : 'hidden' }">{text}</div>