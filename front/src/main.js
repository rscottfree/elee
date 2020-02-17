import { elee as e }  from './elee.js';


e.target = document.body;
const app = e.makeApp({
	id: 'app',
	w: 800,
	h: 380,
});

e.target = document.querySelector('#app');

// e.x = 0;
// e.y = 0;
// e.makeContainer({
// 	id: 'app-container',
// 	w: 800,
// 	h: 380,
// });

// e.target = document.querySelector('#app-container');

e.x = 1;
e.y = 0;
const t1 = e.makeText({
	text: 'Some text here'
});

e.y = 1;
const t2 = e.makeText({
	text: 'With Events'
});

e.y = 2;
const t3 = e.makeText({
	text: 'Element position is'
});

e.x = 16;
e.y = 0;
const b1 = e.makeButton({
	text: 'BUTTONS',
});

b1.$on('click', event => {
	t1.$set({text: 'updated!'});
	// t1.text = 'updated!';
	// t1.$destroy();

});

e.x = 19;
e.y = 1
e.makeLink({
	text: 'A Link',
});

e.x = 21;
e.y = 2;
e.makeLink({
	text: 'absolute',
});


e.x = 1;
e.y = 3;

e.makeText({
	text: 'HI',
});
e.x = 4;
const text1 = e.makeInput({
	text: 'Inputs',
	w: 19,
});

e.x = 24;
e.y = 3;
const clickMe = e.makeButton({
	text: 'Click Me',
	w: 12,
});

e.x = 40;
e.y = 0;
const s1 = e.makeSection({
	id: 'section1',
	w: 24,
	h: 9,
});

// e.target = document.querySelector('#section1');
e.x = 41;
e.y = 0;
const sectionText = e.makeText({
	text: 'Section!',
});

// setTimeout(() => {
// 	console.log(s1);
// 	s1.$set({x:  s1.x + 3});
// 	sectionText.$set({x: sectionText.x + 3});
// }, 1300);

// e.target = document.querySelector('#section2');
e.x = 43;
e.y = 3;
e.makeText({
	text: 'Text within',
});

const c1 = e.newContainer();

e.x = 8;
e.y = 1;
const modal = e.makeModal({
	w: 23,
	h: 8,
});
c1.add(modal);

e.x = 10;
e.y = 2;
c1.add(e.makeTextBlock({
	w: 19, h: 4,
	text: 'A dialog box with text in it. Dialogs obey the view hierarchy.',
}));

const c2 = e.newContainer();
e.x = 10;
e.y = 7;
const saveButton = e.makeButton({
	text: 'SAVE',
	w: 9,
});
c1.add(saveButton);
c2.add(saveButton);

e.x = 20;
e.y = 7;
const cancelButton = e.makeButton({
	text: 'CANCEL',
	w: 9,
});
c1.add(cancelButton);
c2.add(cancelButton);

c2.$on('click', () => {
	c1.$set({ v: false });
});

clickMe.$on('click', () => {
	c1.$set({ v: true });
});

// b1.element.addEventListener('click', event => {
// 	console.log('click!', event);
// 	t1.text = 'updated!';
// 	t1.x += 1;
// });

// console.log('c12', c12);
// e.target = document.querySelector('#idhere');
// e.x = 200;
// e.y = 0;
// e.makeComponent2({
// 	name: 'comp2-2',
// });

// Maybe when we listen for input we always wait a tick until processing
// in order to wait until all elements are rendered?