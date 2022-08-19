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

## Clearer Code

Normal frontend javascript framework loves to mix and overuse their amazing inline tag. Such features is helpful in a lot of ways, but when goes to the wrong hand, it gave pain and suffering more than help.

Let me give you an example of a crazy `react` code written by some real developer (that's me).

`Colorful.jsx`
```jsx
export default function Colorful(props) {
    const { withbg, bgcolor, color, children } = props
    const ColorApp = ({text}) => (
        <span style={"background: "+ bgcolor}>
            {text}
        </span>
    )
    const colorSpan = <span style={"color:" + color}>{children}</span>

    return (
        <span>
            {withbg ? <ColorApp text={colorSpan} /> : colorSpan}
        </span>
    )
}
```
Why did someone torture us like like this? why did this happen? how could something like this could ever happen in the first place? this is disaster, this shouldn't be a real code! there is no way a compiler would compile this piece of garbage.

> But it is a valid code

The problem is the solution. by allowing tags to be anywhere in the code, it ultimately allowing anyone to put tags anywhere in the code.

They did this because they are allowed and nothing prevent them to do so, even the compiler itself allow it!

For that reason, Reactive CML have structure.

### Reactive CML Structure

Any code before `div` or `span` tag is considered a **logic** and will be executed as a script **view is not allowed here**.

Any code after the tag including the tag is considered as **view** and will be tranformed into dom. **Not a single logic allowed here**.

```
[logic]
-------------
[view]
```
This structure makes it impossible to rewrite the code like that bad example before and force us to find a better **elegant** and **readable** solution.

for demonstration purpose, this is a way to rewrite the example code before with Reactive CML, considering the component have the same props.

`Colorful.rc`
```js
const { withbg, bgcolor, color } = props
const bgStyle = `background: ${bgcolor};`
const colorStyle = `color: ${color}`

span <
    if condition="withbg" <
        span bind:style="bgStyle" <
            span bind:style="colorStyle" <
                children <>
            >
        >
    >
    unless condition="withbg" <
        span bind:style="colorStyle" <
            children <>
        >
    >
>
```
This doesn't mean `react` is a badly designed framework. It just mean that `react` gave too much freedom to it's developer that anyone could messed it up easily intentionally or not.

Too much freedom could lead to chaos. This is the problem to almost every unipinionated framework out there, they are non opinionated. Opinion in this case refers to design pattern and standard.

When you try to tell them they are doing things wrong, they told you your opinion doesn't matter because they are using unipionated framework.

In defense to `react`, this is a way to rewrite previously bad `react` code in a better way

`Colorful.jsx`
```jsx
export default function Colorful(props) {
    const { withbg, bgcolor, color, children } = props
    const colorSpan = <span style={"color: " + color}>{children}</span>

    return (
        <span>
            {
                withbg
                    ? (<span style={"background: " + bgcolor}>{colorSpan}</span>)
                    : colorSpan
            }
        </span>
    )
}
```
Some people eventually going to say that this is not a better way, not because it is not, but because they have their own opinion on how to write `react` code **the right way**. Unless they are your manager or higher ups, their opinion doesn't matter because code written with unopinionated framework follows personal opinion rather than public opinion.
