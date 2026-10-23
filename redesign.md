# TASK: Recreate the Reference UI — Hand-Drawn "Our Vibathon" Landing Page

## 1. PRIMARY OBJECTIVE

Build a polished, responsive React landing page that closely matches the provided reference image.

The page is a playful, hand-drawn text interaction interface with:
- A warm, off-white paper background.
- Hand-sketched black outlines and decorative doodles.
- A large, rounded beige text input.
- A hand-drawn laptop illustration with a hand emerging from the screen.
- A centered "OUR VIBATHON" heading.
- Eight pill-shaped personality/tone selection buttons.
- A minimalist, illustrated, notebook-like aesthetic.

**IMPORTANT:** Do not redesign this into a conventional SaaS dashboard, gradient-heavy AI website, glassmorphism interface, or generic Bootstrap/Tailwind component layout.

The final result should look like a carefully illustrated page from a creative sketchbook that has been turned into an interactive website.

Use the supplied reference image as the primary visual source of truth. Match its composition, spacing, proportions, colors, and decorative details as closely as possible.

---

## 2. TECHNOLOGY AND PROJECT CONSTRAINTS

- Use the existing React project and its current build tooling.
- Inspect the repository before making changes.
- Reuse the installed dependencies wherever possible.
- Do not replace the existing project setup or package manager.
- Do not modify unrelated files or other contributors' work.
- If multiple developers or agents are working on this repository, only modify files assigned to this task and avoid touching shared files owned by another contributor.
- Use reusable React components.
- Keep styling organized and maintainable.
- Ensure the page works on desktop, tablet, and mobile.
- Avoid unnecessary dependencies.
- Do not use a screenshot of the reference as the entire website background.
- Recreate the elements as actual HTML, CSS, SVG, or properly licensed illustrations.

If the project already contains a component library, icon package, animation library, or design system, inspect it before adding anything new.

---

## 3. OVERALL VISUAL IDENTITY

### Design language

The interface should resemble:
- A hand-illustrated notebook page.
- A whimsical editorial website.
- A paper-based creative tool.
- A black-ink doodle illustration on warm cream paper.

The style combines simple geometric UI components with intentionally imperfect, hand-drawn illustrations.

The UI should feel human, tactile, playful, and slightly quirky.

### Visual principles

1. Use black ink-like outlines rather than clean, thin corporate borders.
2. Use warm beige fills instead of pure gray UI surfaces.
3. Use a warm ivory background rather than pure white.
4. Use rounded, slightly irregular shapes.
5. Use small, scattered decorative marks around the primary content.
6. Keep the overall page uncluttered.
7. Preserve large areas of negative space.
8. Keep the main interface centered and visually balanced.
9. Avoid excessive shadows, gradients, glows, and animations.
10. Prefer hand-drawn SVG illustrations over generic stock graphics.

The sketch-like appearance should come from the illustration and detailing, not from making every element distorted or difficult to use.

---

## 4. COLOR PALETTE

Use the following approximate colors as a starting point. Adjust them slightly if needed to match the reference.

| Element | Suggested color |
|---|---|
| Main page background | `#FAF9F4` |
| Slight paper variation | `#F5F1E8` |
| Main beige surfaces | `#E6D7BC` |
| Warm beige highlights | `#D7C19E` |
| Dark outlines | `#11100D` |
| Primary text | `#11100D` |
| Secondary ink details | `#39352B` |

### Color rules

- Backgrounds should remain light, warm, and low-contrast.
- Main controls should use muted beige or parchment colors.
- Text and outlines should be nearly black.
- Decorative grid marks may use black, dark brown, or a subtle muted reddish-brown accent.
- Do not introduce bright blue, purple, neon green, or saturated gradients.
- Keep the design mostly monochromatic, using beige and black as the dominant colors.

---

## 5. PAGE LAYOUT AND COMPOSITION

Create one main landing-page composition that occupies the viewport.

### Main layout structure

The vertical order should be:

1. Decorative notebook-style marks in the page corners.
2. Laptop-and-hand illustration above the main input.
3. Large central text input.
4. "OUR VIBATHON" title with small decorative strokes.
5. Eight tone-selection pills arranged in two rows.

The content is centered horizontally.

The main interactive elements occupy the central portion of the page, while the decorative doodles extend toward the corners and outer edges.

### Desktop composition

For a viewport approximately 1466 × 828 pixels, use the supplied image as the proportional reference.

Approximate positioning:
- Laptop illustration: centered horizontally, around 13–42% of the viewport height.
- Main input: approximately 63% of the viewport width, centered horizontally.
- Main input height: around 110 pixels in the reference, scaled appropriately for CSS.
- Section heading: directly below the input with a moderate gap.
- First row of pills: below the heading.
- Second row of pills: below the first row with approximately 25–30 pixels of vertical spacing.
- Corner doodles: anchored to the outer viewport corners.

These are visual proportions, not rigid pixel requirements. The layout must adapt to the actual viewport.

### Main content wrapper

Use a centered main container with:
- A sensible maximum width.
- Fluid horizontal padding.
- Vertical spacing that preserves the reference's proportions.
- Enough room around the laptop illustration.
- No visible conventional card enclosing the whole composition.

Do not place the entire composition inside a white rectangular card.

The page background itself is the canvas.

---

## 6. BACKGROUND AND DECORATIVE DOODLES

The background is not plain white. It resembles lightly textured warm paper.

### Paper texture

Use a subtle CSS texture or a small, locally available paper-texture asset.

Possible techniques:
- A nearly invisible repeating noise texture.
- Extremely subtle off-white tonal variation.
- A low-opacity paper grain overlay.

Keep the texture restrained. It must never compete with the interface or make text less readable.

Avoid strong gradients or obvious photographic paper textures.

### Upper-left corner

Add a cropped hand-drawn grid or hashtag-like doodle.

Appearance:
- Several intersecting diagonal and near-vertical lines.
- Mostly black ink, with one or two muted reddish-brown or olive-toned lines.
- The lines extend beyond the top and left viewport edges.
- Slight variation in line angle and length.
- Uneven but natural ink strokes.

The doodle should be partially offscreen, as in the reference.

### Lower-right corner

Add a second cropped grid doodle.

Appearance:
- Several long, slanted, intersecting black lines.
- Lines enter from the lower-right edge.
- Some strokes are cropped by the bottom and right edges.
- Use a similar sketchbook style to the upper-left grid.

### Additional decorative marks

Add scattered small doodles:
- Tiny starbursts on the left side.
- Small sparkle shapes around the laptop.
- A few black accent strokes around the input.
- Three short dark marks in the upper-right area.
- Additional sparkle outlines near the right edge.

These marks should look hand-drawn, not like random Unicode symbols placed in text.

### Implementation recommendation

Create a dedicated `BackgroundDoodles` React component.

Use inline SVG with:
- `stroke="#11100D"` or similar.
- `fill="none"` for outlined shapes.
- Rounded stroke caps and joins.
- Slightly varied line angles.
- A few imperfect paths rather than perfectly uniform geometric icons.

Use `position: absolute` for decorative elements and `pointer-events: none` so they never block interaction.

Decorative elements should not interfere with mobile controls or cause horizontal scrolling.

---

## 7. LAPTOP AND EMERGING HAND ILLUSTRATION

This is the most visually distinctive decorative element.

Position it centrally above the text input.

### Overall silhouette

Illustrate an open laptop in a slightly tilted, three-quarter perspective.

The illustration should have:
- A rectangular screen with rounded or slightly imperfect corners.
- A warm beige screen fill.
- A black hand-drawn outer outline.
- A visible keyboard and laptop base.
- A few thin internal keyboard lines.
- A small trackpad.
- A subtle secondary outline to imitate sketching.
- A few short sketch marks beneath the laptop.

The laptop should look illustrated with black ink and filled with muted beige.

It must not resemble a realistic photograph, 3D render, or standard flat corporate icon.

### Screen

- Slightly tilted rather than perfectly horizontal.
- Black outer border.
- Warm tan inner screen.
- An additional thin inset outline.
- A few subtle irregularities in the outline.

### Keyboard

- Visible on the angled laptop base.
- Multiple small outlined keycaps.
- Dark thin strokes.
- A small rectangular trackpad toward the front.

### Emerging hand

A stylized cartoon hand and forearm should emerge from the laptop screen and extend downward and toward the right.

The arm should:
- Have a white or very pale warm fill.
- Use a bold black outline.
- Include a sleeve or cuff near the laptop screen.
- Have simplified fingers extending downward.
- Look intentionally hand-drawn.

The hand is important to the personality of the composition. Do not omit it or replace the entire illustration with a generic laptop icon.

### Nearby motion and sparkle details

Add:
- A few black radial lines extending from the laptop's right side.
- Small sparkle doodles near the left side.
- A small outlined sparkle near the upper-right of the illustration.

### Preferred implementation

Create a standalone `LaptopIllustration` component using inline SVG.

This gives the most control over:
- Perspective.
- Stroke width.
- Layering.
- Hand shape.
- Keyboard details.
- Sparkle placement.

If an existing illustration asset closely matches the reference and can be used legally, it is also acceptable.

Do not use an emoji for the laptop or hand.

### Size

On a desktop viewport around 1466 pixels wide, the illustration should occupy approximately 400–460 pixels horizontally, including its nearby motion lines.

Keep the central laptop itself narrower than the main input.

The laptop should sit visually above the input with a relatively small gap, but it must not overlap the input.

Use responsive sizing on smaller screens.

---

## 8. MAIN TEXT INPUT

This is the largest and most prominent UI component.

Create a long, horizontal, pill-like text-entry area centered beneath the laptop illustration.

### Shape and dimensions

Desktop reference:
- Approximately 910 pixels wide.
- Approximately 110 pixels tall.
- Large rounded corners.
- Slightly irregular, hand-drawn outer silhouette.
- Warm beige background.
- Bold black outline.

For implementation, use fluid sizing such as:
- `width: min(100%, 910px)`.
- A desktop height around 108–112 pixels.
- Responsive horizontal padding.
- A large border radius.

The reference shape is similar to an elongated rounded rectangle, but the outline should feel a little organic rather than mechanically perfect.

### Background

Use a muted warm parchment/beige fill, approximately `#E6D7BC`.

Avoid transparency, glassmorphism, gradients, or pure white.

### Border

- Near-black.
- Approximately 2.5–3 pixels on desktop.
- Rounded joins and caps if using SVG.
- Slightly sketch-like rather than perfectly sterile.

For a more faithful appearance, consider drawing the outer border as a custom SVG path behind a real input element.

If using CSS borders, prioritize responsiveness and simplicity while retaining the organic visual style.

### Text-entry area

Inside the container, place a real, accessible text input or textarea.

The placeholder must read:

`Enter your text here...`

Typography:
- Friendly, rounded, informal.
- Black text.
- Approximately 20–22 pixels on desktop.
- Vertically centered.
- Left-aligned.

### Cursor detail

The reference shows a thin, vertical black stroke near the beginning of the text area.

This resembles a visible text caret.

Prefer a genuine focus caret if the input is focused. If recreating it as a decorative element, ensure it disappears or moves appropriately when the user starts typing.

Do not permanently overlay a fake cursor that interferes with actual text input.

### Send icon

At the far-right side of the input, include a hand-drawn paper-plane/send icon.

Requirements:
- Black outline.
- No filled bright color.
- Approximately 35–42 pixels in visual size.
- Centered vertically.
- Enough padding from the right edge.
- Consistent with the sketch-like line art.

Use an existing installed icon library only if it offers an appropriate outline icon. Otherwise, create the icon as a small inline SVG.

The icon should be a real interactive button with:
- An accessible name such as "Send text".
- Keyboard support.
- A visible focus state.
- A pointer cursor.

### Interaction

- Users can enter text.
- The send control should submit the text or invoke an existing application handler.
- Enter may submit a single-line input if that behavior fits the app.
- If the project already contains submission logic, connect the component to it.
- Do not invent backend endpoints or external API integrations.
- Prevent accidental submission of empty or whitespace-only input.
- Show validation feedback in a way that matches the visual theme.

If no submission logic exists, implement a clean callback-based interface that can later be connected to the application's actual behavior.

---

## 9. "OUR VIBATHON" SECTION HEADING

Place the heading directly beneath the main input.

Exact displayed text:

`OUR VIBATHON`

### Typography

The heading is:
- Uppercase.
- Bold.
- Black.
- Informal and slightly hand-drawn.
- Visually stronger than the labels inside the pills.
- Approximately 30–34 pixels on desktop, depending on the chosen font.

Use a rounded, handwritten display font.

Possible font choices, in order of preference:
1. A suitable handwritten or playful display font already available in the project.
2. `Patrick Hand SC`.
3. `Kalam` with a bold weight if available.
4. Another legible, playful font that approximates the reference.

For consistent rendering, load a suitable web font through the project's existing font-loading approach or bundle the font locally if available.

Do not use a conventional geometric sans-serif for this heading if a suitable handwritten font is available.

### Decoration

Add small black hand-drawn accent strokes on both sides of the heading.

Each side should have approximately two or three short strokes.

The marks should look like expressive ink flourishes emphasizing the title.

Keep them balanced around the text without making the heading too wide.

### Alignment

- Center horizontally.
- Moderate spacing above and below.
- Keep the heading close enough to the input to feel like one composition.
- Leave enough space below for the first row of buttons.

---

## 10. TONE-SELECTION BUTTONS

The bottom section contains eight pill-shaped buttons arranged into two centered rows.

Each button includes:
1. A black outline icon on the left.
2. A text label.
3. A warm beige fill.
4. A bold, rounded outline.

These are functional controls, not decorative labels.

### Exact labels and icons

Row 1:
1. CEO — sparkle icon.
2. Gen Z — star icon.
3. Lawyer — scales-of-justice icon.
4. Professional — briefcase icon.

Row 2:
1. Friendly — smile icon.
2. Roast — flame icon.
3. Romantic — heart icon.
4. Motivational — crown icon.

Preserve the exact spelling and capitalization.

### Button dimensions

Approximate desktop dimensions:
- Height: 64 pixels.
- Width: content-dependent, approximately 155–215 pixels.
- Border radius: fully rounded pill.
- Border thickness: approximately 2.5 pixels.
- Horizontal padding: around 22–28 pixels.
- Icon-to-text gap: approximately 12–16 pixels.

The Professional button is wider because its label is longer.

The buttons should not all have an identical fixed width if doing so would distort the proportions of the reference.

### Button spacing

Desktop:
- Center the rows horizontally.
- Use approximately 26–30 pixels of horizontal space between buttons.
- Use approximately 24–30 pixels of vertical space between the two rows.
- Keep the four buttons in each row visually balanced.

Use flexbox with wrapping or two explicit row containers.

Do not position each button with hardcoded absolute coordinates.

### Button fill and outlines

Use the same beige family as the input, perhaps with very slight tonal variation.

Each button should have:
- A black outline.
- A pill shape.
- A black line-art icon.
- Black label text.
- No bright accent fill.

Do not add strong shadows or gradient fills.

### Icons

Use consistent, monochrome outline icons.

Preferred implementation:
- Reuse the project's existing icon library if suitable.
- If `lucide-react` is already installed, use its outline icons where appropriate.
- Otherwise, use small inline SVGs.

Suggested icon mappings:
- CEO: `Sparkles`
- Gen Z: `Star`
- Lawyer: `Scale`
- Professional: `BriefcaseBusiness` or `Briefcase`
- Friendly: `Smile`
- Roast: `Flame`
- Romantic: `Heart`
- Motivational: `Crown`

Use consistent sizing around 24–28 pixels.

Use black strokes, no multicolor fills, and consistent stroke widths.

### Typography

Button labels should be:
- Approximately 19–21 pixels on desktop.
- Black.
- Medium or semibold.
- Rounded and informal.
- Easy to read.

Use the same general font family as the input, with the heading allowed to use a stronger display style.

### Interactive behavior

Each button represents a selectable text style or personality.

Implement a selected state.

When a user selects a tone:
- Store the selected tone in React state.
- Apply a subtle visual change.
- Preserve the original design language.

Possible selected-state changes:
- Slightly darker beige fill.
- A thicker or slightly offset black outline.
- A small transform of approximately `translateY(-1px)`.
- A subtle change in the icon or outline weight.

Do not use neon colors, bright blue selection states, or large glowing shadows.

The selected state must be visible but restrained.

Make the interaction keyboard-accessible, with appropriate focus styling and `aria-pressed` for toggle-style selection.

Determine whether the original product expects a single selected tone or multiple selected tones. Prefer a single selected tone if no other product requirements exist.

Selecting a tone should not automatically submit the text unless the existing application explicitly requires that behavior.

---

## 11. TYPOGRAPHY SYSTEM

Typography is an important part of the illustrated identity.

The reference uses an informal, rounded, handwritten appearance.

Use a consistent system:
- Heading: bold, uppercase, playful display face.
- Input placeholder and entered text: rounded, friendly, readable.
- Button labels: rounded, medium-weight, informal.
- Validation and accessibility text: readable and visually understated.

Potential font combination:
- `Patrick Hand SC` for the main heading.
- `Patrick Hand` or `Kalam` for input and button labels.

Use one primary family wherever possible to maintain cohesion.

Avoid overly decorative fonts that reduce readability.

Do not use a typical futuristic AI font, ultra-thin minimalist font, or condensed corporate heading.

---

## 12. RESPONSIVE DESIGN

The desktop reference is the primary target, but the composition must work on smaller screens.

### Large desktop: 1200px and above

- Keep the main input near the reference's proportions.
- Preserve the centered laptop illustration.
- Display four tone buttons per row.
- Keep corner doodles partially cropped.
- Preserve generous negative space.

### Tablet: 768–1199px

- Reduce the maximum width of the input.
- Scale down the laptop illustration slightly.
- Keep buttons in two rows of four if sufficient space exists.
- Reduce button padding and gaps as necessary.
- Keep decorative elements away from the main controls.

### Mobile: below 768px

- Reduce the laptop illustration to approximately 240–300 pixels wide, depending on available space.
- Make the input almost full-width with comfortable side margins.
- Reduce the input height to approximately 76–88 pixels.
- Reduce heading size to approximately 25–29 pixels.
- Arrange buttons into two columns when space permits.
- Allow button widths to fill their grid cells consistently.
- Reduce icon sizes slightly.
- Reduce decorative doodle opacity or hide selected outer decorations if they clutter the viewport.
- Ensure no horizontal overflow.
- Maintain comfortable touch targets of at least 44 × 44 pixels.

### Very narrow mobile: below 380px

- Keep the input usable without clipping the send button.
- Allow text and icons to shrink slightly.
- Use two button columns if labels fit.
- If necessary, let longer labels wrap gracefully or use a single-column layout as a last resort.
- Never make the text input or buttons extend beyond the viewport.

### Vertical behavior

Do not force all content into a fixed-height container that causes clipping on short screens.

Use normal document flow and sensible minimum heights.

The page should scroll vertically if needed.

Do not let the decorative illustrations create horizontal scrolling.

---

## 13. ANIMATION AND MICROINTERACTIONS

The reference is mostly static, so animations must remain subtle.

Do not turn the interface into an animation showcase.

Recommended interactions:

### Tone buttons
- Slight movement on hover.
- Subtle fill adjustment.
- Quick transition around 150–220ms.
- Clear pressed state.

### Send button
- Slight movement or scale on hover.
- Subtle active state when clicked.

### Laptop illustration
Optionally introduce a very gentle floating animation, but only if it does not detract from the hand-drawn aesthetic.

Keep it extremely subtle:
- Small vertical movement.
- Slow duration.
- No exaggerated rotation.
- No aggressive bouncing.

Respect `prefers-reduced-motion`.

Avoid:
- Scroll-jacking.
- Large parallax effects.
- Strong spring animations.
- Excessive motion around the input.
- Animations that move the layout itself.

---

## 14. COMPONENT ARCHITECTURE

Keep the implementation modular.

Suggested structure:

```text
src/
  components/
    BackgroundDoodles.jsx
    LaptopIllustration.jsx
    TextInput.jsx
    VibathonHeading.jsx
    ToneSelector.jsx
    ToneButton.jsx
  styles/
    vibathon.css
  pages/
    VibathonPage.jsx
```

Adapt this to the repository's actual conventions. Do not create duplicate structures if the project already has a component organization.

### Component responsibilities

`BackgroundDoodles`
- Decorative corner grids.
- Starbursts.
- Sparkles.
- Accent strokes.

`LaptopIllustration`
- Laptop body and screen.
- Keyboard and trackpad.
- Emerging hand.
- Nearby motion marks and sparkles.

`TextInput`
- Input state or controlled value.
- Placeholder.
- Send button.
- Validation.
- Submission callback.

`VibathonHeading`
- Heading text.
- Left and right decorative marks.

`ToneSelector`
- Available tone definitions.
- Selected-tone state.
- Layout of both rows.

`ToneButton`
- Individual icon and label.
- Accessible button behavior.
- Hover, focus, and selected states.

`VibathonPage`
- Main layout.
- Shared state.
- Component composition.
- Integration with the existing app.

Keep business logic separate from decorative SVG implementation where practical.

---

## 15. IMPLEMENTATION DETAILS

### Styling

- Prefer CSS variables for the color palette.
- Use `box-sizing: border-box`.
- Use flexbox and CSS grid for layout.
- Use `clamp()` for fluid typography and sizing when helpful.
- Use `min()`, `max()`, and `minmax()` to prevent overflow.
- Use CSS custom properties for repeated stroke and spacing values.
- Use `overflow: hidden` only where necessary for individual decorative elements; do not clip the main interface.

Suggested variables:

```css
:root {
  --paper: #FAF9F4;
  --paper-alt: #F5F1E8;
  --parchment: #E6D7BC;
  --parchment-dark: #D7C19E;
  --ink: #11100D;
  --ink-muted: #39352B;

  --outline-width: 2.5px;
  --pill-radius: 999px;

  --content-max-width: 1120px;
  --input-max-width: 910px;
}
```

Adjust these to match the existing project conventions.

### SVG illustration details

- Use `viewBox` for responsive scaling.
- Set `stroke-linecap="round"` and `stroke-linejoin="round"` where appropriate.
- Keep the SVG artwork crisp at all screen sizes.
- Use layered paths to produce the double-line sketch effect.
- Avoid using overly perfect symmetry for the hand-drawn details.
- Use appropriate `aria-hidden="true"` for purely decorative SVGs.

### Accessibility

- Maintain sufficient text/background contrast.
- Ensure every control is keyboard-accessible.
- Provide visible focus indicators.
- Add accessible names to icon-only buttons.
- Use semantic headings and form elements.
- Use `aria-pressed` on selectable tone buttons.
- Do not rely on color alone to communicate selection.

---

## 16. FILE OWNERSHIP AND COLLABORATION RULES

If another agent or developer is working on the same repository:

- Treat the existing Git working tree as shared.
- Do not overwrite or revert changes made by the other developer.
- Do not edit files outside the scope of this feature.
- Do not modify shared routing, global styles, package configuration, or application entry points unless the feature cannot be integrated otherwise.
- Prefer feature-specific components and styles.
- Before editing a file that another developer might own, inspect its current contents and repository status.
- Avoid broad formatting changes.
- Do not run destructive Git commands.
- Do not stage, commit, or push unless explicitly instructed.
- If an integration point is owned by another contributor, create the feature components and report exactly what integration is required.

If a shared file must be modified, make the smallest possible change and preserve unrelated content.

---

## 17. QUALITY ASSURANCE

After implementation:

1. Run the existing development server.
2. Check the page at approximately 1466 × 828 pixels.
3. Compare the rendered result against the supplied reference image.
4. Check tablet and mobile widths.
5. Verify that no horizontal scrollbar appears.
6. Test text entry and submission.
7. Test all eight tone buttons.
8. Verify hover, active, selected, and focus states.
9. Check keyboard navigation.
10. Check browser console errors.
11. Ensure all assets load.
12. Verify that the page does not interfere with unrelated routes or features.

If browser automation or screenshot comparison is available, use it to refine the design.

Pay particular attention to:
- The laptop illustration's position and proportions.
- The input's width and height.
- The amount of space between the laptop and input.
- The heading's vertical position.
- The alignment of both rows of buttons.
- The size and placement of the decorative corner doodles.
- The overall warm paper-and-ink appearance.

---

## 18. DEFINITION OF DONE

The implementation is complete when:

- The page closely resembles the reference image.
- The warm paper background and corner doodles are present.
- The laptop-and-hand illustration is visually recognizable and detailed.
- The central input matches the reference's long, rounded beige appearance.
- The send icon is present and functional.
- The "OUR VIBATHON" heading has the correct text and styling.
- All eight tone buttons appear in the correct order.
- Each button has an appropriate outline icon.
- Tone selection works and provides visual feedback.
- The layout adapts cleanly to mobile and tablet.
- The page has no horizontal overflow or broken elements.
- The implementation follows the existing repository structure.
- No unrelated components or files have been unnecessarily changed.

## FINAL INSTRUCTION

Prioritize visual fidelity over unnecessary technical complexity.

Build the actual interface, not a rough approximation using generic components.

The finished result should immediately communicate the same visual identity as the reference: warm paper, black ink, playful hand-drawn illustrations, expressive doodles, and a clean central text interaction.

After implementation, provide a concise report stating:
- Which files were created or modified.
- Which interactions work.
- Whether the page was tested at desktop and mobile sizes.
- Any remaining limitations or integration requirements.