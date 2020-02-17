import App from './App.svelte';
import Text from './Text.svelte';
import Button from './Button.svelte';
import Link from './Link.svelte';
import Input from './Input.svelte';
import Section from './Section.svelte';
import Modal from './Modal.svelte';
import TextBlock from './TextBlock.svelte';


// Characters are fixed 12x34 (font-size: 20px)

class Elee {
    constructor() {
        this.target = document.body;
        this.x = 0;
        this.y = 0;
    }

    make(Component, properties) {
        const c = new Component({
            target: this.target || document.body,
            props: {
                ...properties,
                x: this.x,
                y: this.y,
            }
        });

        return c;
    }

    makeApp({id, w, h}) {
        return this.make(App, {
            id, w, h,
        });
    }

    makeContainer({id, w, h}) {
        return this.make(Container, {
            id, w, h,
        });
    }

    makeText({ id, text }) {
        return this.make(Text, {
            id, text,
        });
    }

    makeButton({ id, text, w }) {
        return this.make(Button, {
            id, text, w
        });
    }

    makeLink({ id, text }) {
        return this.make(Link, {
            id, text,
        });
    }

    makeInput({ id, text, w }) {
        return this.make(Input, {
            id, text, w,
        });
    }

    makeSection({ id, w, h }) {
        return this.make(Section, {
            id, w, h,
        });
    }

    makeModal({ id, w, h }) {
        return this.make(Modal, {
            id, w, h,
        });
    }

    makeTextBlock({ id, w, h, text }) {
        return this.make(TextBlock, {
            id, w, h, text,
        });
    }

    newContainer() {
        return new Container();
    }

    // start() {
    //     const app = new App({
    //         target: document.body
    //     });
    // }
}

class Container {
    constructor() {
        this.items = [];
    }

    add(component) {
        this.items.push(component);
    }

    remove(component) {
        this.items = this.items.filter(item => item !== component);
    }

    $on(eventName, callback) {
        this.items.forEach(item => {
            item.$on(eventName, callback);
        });
    }

    $set(update) {
        this.items.forEach(item => {
            item.$set(update);
        });
    }
}

const elee = new Elee();

export { elee };
// export { context };
// export let context;
