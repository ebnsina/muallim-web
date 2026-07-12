/**
 * The design system.
 *
 * Components consume semantic tokens (`bg-surface`, `text-muted`) and never a
 * primitive step or a hex. See `$lib/design/tokens.css`, and `/ui` for the
 * gallery every one of these is rendered in.
 */
// AiField/AiQuiz are imported directly where used, not re-exported here: they pull
// in the TanStack AI SDK, and the barrel is on every page's import path.
export { default as Alert, type AlertTone } from './Alert.svelte';
export { default as AppHeader } from './AppHeader.svelte';
export { default as AuroraBackdrop } from './AuroraBackdrop.svelte';
export { default as AuthShell } from './AuthShell.svelte';
export { default as Badge, type BadgeTone } from './Badge.svelte';
export { default as Breadcrumbs, type Crumb } from './Breadcrumbs.svelte';
export { default as Button, type ButtonSize, type ButtonVariant } from './Button.svelte';
export { default as Card } from './Card.svelte';
export { default as CourseCard } from './CourseCard.svelte';
export { default as TintCard } from './TintCard.svelte';
export { default as Certificate } from './Certificate.svelte';
export { default as Checkbox } from './Checkbox.svelte';
export { default as Difficulty } from './Difficulty.svelte';
export { default as HighlightableText } from './HighlightableText.svelte';
export { default as EmptyState } from './EmptyState.svelte';
export { default as Field } from './Field.svelte';
export { default as FileList } from './FileList.svelte';
export { default as Icon } from './Icon.svelte';
export type { IconSvgElement } from '@hugeicons/svelte';
export { default as Input } from './Input.svelte';
export { default as Label } from './Label.svelte';
export { default as LessonIcon } from './LessonIcon.svelte';
export { default as MarketingFooter } from './MarketingFooter.svelte';
export { default as MarketingHeader } from './MarketingHeader.svelte';
export { default as Numeral } from './Numeral.svelte';
export { default as Page, type PageWidth } from './Page.svelte';
export { default as PageAurora } from './PageAurora.svelte';
export { default as PageHeader } from './PageHeader.svelte';
export { default as Sheet } from './Sheet.svelte';
export { default as Progress } from './Progress.svelte';
export { default as RadialProgress } from './RadialProgress.svelte';
export { default as Radio } from './Radio.svelte';
export { default as Row } from './Row.svelte';
export { default as Score } from './Score.svelte';
export { default as Select } from './Select.svelte';
export { default as Stars } from './Stars.svelte';
export { default as Textarea } from './Textarea.svelte';
export { default as ThemeToggle } from './ThemeToggle.svelte';
export { default as Toaster } from './Toaster.svelte';
export { default as Verdict, type VerdictKind } from './Verdict.svelte';
export { default as Donut, type Segment } from './Donut.svelte';
export { default as DonutLegend } from './DonutLegend.svelte';
export { default as AppRail } from './AppRail.svelte';
