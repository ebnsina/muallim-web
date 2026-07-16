# The Muallim design system

One brand, two surfaces: the **product**, which a teacher lives in all day, and the
**marketing site**, which someone reads once before deciding. They share a hue and
a typeface and almost nothing else, because a dense administrative table and a
landing page are not the same problem.

This file is the map. The rationale for each decision lives beside the tokens
themselves — `src/lib/design/tokens.css` argues the product's palette at length,
and the marketing layout argues its own. Read those before changing a value.

## The brand is one number

`--brand-hue: 128` in `src/lib/design/tokens.css`. Olive. Every step of the `--b-*`
ramp reads its hue from that one number, and therefore so does every accent, ring
and primary button, in light and dark. Move the number and the product moves.

Olive was chosen for what it is _not_: green at ~145° is the success colour, and a
green Submit beside a green Correct is a sentence with two verbs. Olive sits far
enough away that a primary action never reads as a mark.

The marketing site's `--brand: #2e3320` is the same olive, hand-mixed rather than
computed, because that page is light-only and never needed the ramp.

## The two surfaces

|         | Product                                                                                                                        | Marketing                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Tokens  | `src/lib/design/tokens.css`, via `@theme` in `src/routes/layout.css`                                                           | `src/routes/(marketing)/+layout.svelte`, class `.marketing`        |
| Themes  | Light **and** dark. Both are first-class; the viewer's toggle stamps `data-theme` on the root and must win in both directions. | Light only.                                                        |
| Surface | Solid. Cards, borders, tables — density is the point.                                                                          | Paper on cream. Flat cards, 24px corners, a photo behind the hero. |
| Colour  | The `--b-*` ramp plus semantic tokens (`text`, `muted`, `surface`, `danger-text`…).                                            | Cream, ink, olive, lime, lavender, and a warm spectrum for chips.  |
| Type    | Mona Sans; Geist Mono for numerals and code.                                                                                   | The same.                                                          |

**Never hardcode a colour in either.** A colour in a component is a colour that
cannot be themed, and every tenant will want to theme. The one exception is the
marketing hero photograph, which is a photograph.

## The marketing look

Warm and grown rather than corporate. Cream paper, near-black ink, dark olive for
anything that carries weight, and **lime rationed to the one thing on the screen
that should catch the eye**. Lavender is the second voice, for when one accent
cannot separate two ideas. The 24px corner is the shape people will recognise.

It is not frosted glass over an aurora. It was, once: the site ran a berry palette
with blurred translucent panels, the landing was redesigned in warm olive and kept
its own private copy of the tokens, and for a while the product had two looks and
no way to tell which was current. The palette now lives in the layout and nowhere
else. **A token defined twice is a token that disagrees with itself.**

The aurora was tried on the landing's cards and taken back out. It is worth knowing
why, because the ban above reads as dogma otherwise: a wash lowers the contrast
between a card and its neighbour, and contrast was the only thing holding the set
together. The page keeps its one aurora — `--hero-backdrop`, behind the hero — so
the rule in practice is _aurora belongs to the page, not the panels_.

Compose from `src/lib/features/marketing/ui/` — Button, Card, FeatureCard, IconChip,
Tag, Toggle. A page inventing its own card is how the drift started.

`FeatureCard` is the landing's build-block card: a two-tone headline, one object
from `CardArt` clipped by the right edge, an arrow disc at the foot. Two things make
a set of them work, and neither is the background. **A set gets its rhythm from one
bold step** — three paper cards and one olive — because four near-identical surfaces
read as sorted by nothing, and the olive card is where lime is finally spent. **The
object has to have presence**: a heavy open stroke, full opacity, large enough to own
the right half of the card. The objects stay outlines — filling them in was tried and
is not what was wrong. What reads as tentative is a _small, faded_ drawing, and for
four rounds that got mistaken for a background problem.

A section whose cards are each a call to action does not also get a button. The
build block had a "Start free" above the grid, which made five doors on one screen
and drew the eye away from the four that say what the product does.

`ShotCard` is the other half of that section's job: a screenshot of the running app
with a caption saying what is in it. **Show a window at half scale, not the whole
screen shrunk to fit.** The captures are 2360px wide precisely so that 1180 is
legible; three of them squeezed into a third of the page each were grey mush, and
`object-cover` cropped the nav off for good measure. So the card clips a window onto
the image at its half-scale width, offset past the chrome to where the content is,
and fades the cut edge — **the fade goes on the window, not the picture**, or it
lands 800px along where the card has already clipped it.

The object names a real thing — a clipboard is the register, a medal a result, a
banknote with ৳ a fee, a paper plane a course sold abroad. The abstract ring and
globe that came before made a reader decode them, which is a picture doing no work.
The references this answers are lit 3D renders; these are drawings, and closing that
gap needs a modelling tool or a licensed asset pack rather than a cleverer SVG.

## Accessibility is a build-time constraint

Not a later ticket. WCAG 2.2 AA, verified contrast, keyboard reachable,
`prefers-reduced-motion` and `prefers-color-scheme` honoured.
`src/lib/design/contrast.spec.ts` asserts the ramp's contrast, so a palette change
that fails AA fails the build rather than a user.

## The interface is English

Bengali and Arabic (RTL) were planned and are not built: there is no translation
layer and no `dir="rtl"` anywhere. Do not imply otherwise in copy — the landing
page sold "Arabic right-to-left curricula" for months on the strength of a plan.
A school writes its own courses in whatever language it teaches in, which is a
different claim and a true one.
