<script>
	export let id = undefined;
	export let x = 0;
	export let y = 0;
	export let w = 0;
	export let h = 0;
	export let v = true;

	$: xpx = x * 12;
	$: ypx = y * 34;
	$: wpx = (w * 12) - 10;
	$: hpx = (h * 34) - 32;
</script>

<style>
	div {
		position: absolute;
		font-size: inherit;
		font-family: inherit;
		line-height: inherit;
		box-sizing: border-box;
		white-space: nowrap;
		border: 7px double var(--eleeColorLight1);
		border-radius: 10px;
		overflow: hidden;
		background-color: inherit;
		margin: 16px 5px;
		/* padding: 2px 2px 2px 2px; */
	}
</style>

<svelte:options accessors/>

<div id="{id}" class="elee-section"
	style="left: {xpx}px; top: {ypx}px; width: {wpx}px; height: {hpx}px; visibility: { v ? 'visible' : 'hidden' }"></div>