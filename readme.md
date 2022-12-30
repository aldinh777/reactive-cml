# Reactive CML

> "Last thing the world needs is another JavaScript framework"

But this is not **just another javascript framework**, this is another javascript framework **but you write less and clearer code!** (hopefully...)

## In a Nutshell

-   It's **react** with **ivity**
-   It's **angular** and **vue** without the **ng** & **v**
-   It's when **svelte** are written using **science** instead of **magic**

> Reactive CML aim to be **simple and clear** to use, while still allows complex stuff with **low level dom manipulation** which every front-end frameworks are afraid of

_but... isn't the point of ui library is so you don't need to care about that dom stuff?_

aaa... uhmm... well... let's just move on for now!

## Shorter and Faster Write Time

Normally, almost every front-end framework use the well known html tag to implement their framework. For comparison, let's try to write some simple code using `svelte`.

`App.svelte`

```svelte
<script>
let title = 'Sample App'
let content = 'Bolditalicunderline'
</script>

<div>
    <h3>{title}</h3>
    <p>
        Paragraph
        <b><i><u>{content}</u></i></b>
    </p>
</div>
```

This code worth **189 Bytes** of code. How memory expensive that is! and worse, it took **almost a minute** to write that piece of code (with notepad).

The first problem with it is that it used HTML tags, which is good because a lot of web developer familiar with tags but as you know it, you have to write a tag twice, one for the opening (`<div>`) and one for the closing (`</div>`), making the size double than what it have to be.

`Reactive CML`, as the name suggest, instead of using HTML tags, it uses CML tags which is shorter and still keeps the familiarities with HTML Tags.

`App.rc`

```js
let title = 'Sample App'
let content = 'Bolditalicunderline'

div <
    h3 <{title}>
    p <
        Paragraph
        b<i<u<{content}>>>
    >
>
```

Bless me, Look at that shorter **146 Bytes** of code. If you write the same code in `svelte` for a Trilion times, **you write 43 Gigabytes less in `Reactive CML`**. You can install bunch of games with that much storage and still have some left!

Other than it size, it also took **only half a minute** to write it (using notepad), half the time you need to write the code when with `svelte`. That means you finish project earlier while another svelte developer still wasting their precious time writing their codes (using notepad). How Productive!
