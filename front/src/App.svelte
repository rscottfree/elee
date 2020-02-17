<script>
	import { onMount } from 'svelte';

	export let id = 'elee-app';
	export let w = 0;
	export let h = 0;
	export let x = 0;
	export let y = 0;

	onMount(() => {
		// const component = new C2({
		// 	target: context.target,
		// 	props: {
		// 		name: 'nope',
		// 		context,
		// 	}
		// });
		// context.x = 0;
		// context.y = 10;
		// context.target = document.querySelector('#what');
		// const component2 = new C2({
		// 	target: context.target,
		// 	props: {
		// 		name: 'fetch',
		// 		context,
		// 	}
		// });

	});

</script>

<style>
	:global(.elee-app) {
		--eleeHue: 227;
		--eleeSaturation: 30%;
		--eleeLightness: 50%;
		--eleeColorBackground: hsl(var(--eleeHue), var(--eleeSaturation), calc(var(--eleeLightness) - 35%), 1.0);
		--eleeColorLight1: hsl(var(--eleeHue), var(--eleeSaturation), calc(var(--eleeLightness) + 0%), 1.0);
		--eleeColorLight2: hsl(var(--eleeHue), var(--eleeSaturation), calc(var(--eleeLightness) + 20%), 1.0);
		--eleeColorLight3: hsl(var(--eleeHue), var(--eleeSaturation), calc(var(--eleeLightness) + 33%), 1.0);

		--eleeColorDark1: hsl(var(--eleeHue), var(--eleeSaturation), calc(var(--eleeLightness) - 20%), 1.0);
		--eleeColorDark2: hsl(var(--eleeHue), var(--eleeSaturation), calc(var(--eleeLightness) - 30%), 1.0);
		--eleeColorDark3: hsl(var(--eleeHue), var(--eleeSaturation), calc(var(--eleeLightness) - 40%), 1.0);
	}

	@font-face {
		font-family: "Roboto Mono";
		src: url("../Roboto_Mono_400/RobotoMono-regular.ttf");
	}

	div {
		background-color: var(--eleeColorBackground);

		font-size: 10px;
		font-weight: 400;
		/* font-family: 'Odibee Sans', cursive; bad */
		/* font-family: 'Poppins', monospace; bad */
		/* font-family: monospace; */
		font-family: 'Roboto Mono', monospace;
		/* font-family: 'Courier Prime', monospace; */
		/* font-family: 'Montserrat', sans-serif; bad */
		/* font-family: 'VT323', monospace; */
		/* font-family: 'PT Mono', monospace; */
		color: var(--eleeColorLight3);
		box-sizing: border-box;

		margin: 0px;
		position: relative;
		/* border: 20px solid #333;
		padding: 4px; */
	}
</style>

<svelte:head>
	<!-- <link href="https://fonts.googleapis.com/css?family=Roboto+Mono:100,100i,300,300i,400,400i,500,500i,700,700i&display=swap&subset=latin-ext" rel="stylesheet"> -->
	<!-- <link href="./public/Roboto_Mono_400/RobotoMono-regular.ttf"> -->

	<!-- <link href="https://fonts.googleapis.com/css?family=Poppins:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i&display=swap" rel="stylesheet"> -->
	<!-- <link href="https://fonts.googleapis.com/css?family=Odibee+Sans&display=swap" rel="stylesheet"> -->
	<!-- <link href="https://fonts.googleapis.com/css?family=Courier+Prime:400,400i,700,700i&display=swap&subset=latin-ext" rel="stylesheet"> -->
	<!-- <link href="https://fonts.googleapis.com/css?family=Montserrat&display=swap&subset=latin-ext" rel="stylesheet"> -->
	<!-- <link href="https://fonts.googleapis.com/css?family=PT+Mono&display=swap" rel="stylesheet"> -->
	<!-- <link href="https://fonts.googleapis.com/css?family=VT323&display=swap" rel="stylesheet"> -->
</svelte:head>

<!-- <svelte:options accessors/> -->

<div id="{id}" class="elee-app"
	style="left: {x}px; top: {y}px; width: {w}px; height: {h}px;">
</div>