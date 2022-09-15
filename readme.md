# Reactive CML

> "Last thing the world needs is another JavaScript framework" 

But this is not **just another javascript framework**, this is another javascript framework **but you write less and clearer code**.

## Shorter and Faster Write Time

Normally, almost every front-end framework use the well known html tag to implement their framework. Just for comparison purpose, here is some simple code with `svelte`.

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

This worth **189 Bytes** of code, how memory expensive that is! and worse, it took me **almost a minute** to write that code (with notepad).

The first problem with it is that it used HTML tags, which is good because a lot of web developer familiar with tags but as you know it, you have to write a tag twice, for the opening (`<div>`) and the closing (`</div>`), making the size double than it supposed to be.

`Reactive CML`, as the name suggest, instead of using HTML tags, it uses CML tags which is shorter but still keeps the familiarities with usual HTML Tags.

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

Look at that shorter **146 Bytes** of code. If you write the same code in `svelte` for a Trilion times, **you write 43 Gigabytes less in `Reactive CML`**. You can install two Valorant game with that much storage and still have some left!

Other than the size, it also took me **just half a minute** to write it (again with notepad), half the time you need to write the code with `svelte`. You finish a project early when another svelte developer still write their codes twice the time you need to write Reactive CML code (both with notepad). How Productive!
