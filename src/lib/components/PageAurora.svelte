<!--
	A subtle, fixed aurora wash for the whole marketing page — behind every section,
	so the dark body carries the same branded light as the hero. Weaker than the
	hero's own AuroraBackdrop, which layers on top of this in its section.
-->
<div aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
	<div
		class="aurora absolute -top-40 left-[8%] size-[45rem] rounded-full blur-3xl"
		style="background: radial-gradient(closest-side, #3a6ff0, transparent 70%); opacity: 0.16;"
	></div>
	<div
		class="aurora-slow absolute top-[38%] right-[4%] size-[42rem] rounded-full blur-3xl"
		style="background: radial-gradient(closest-side, #7c5cf0, transparent 70%); opacity: 0.13;"
	></div>
	<div
		class="aurora absolute bottom-[-12%] left-1/3 size-[40rem] rounded-full blur-3xl"
		style="background: radial-gradient(closest-side, #22a7f0, transparent 72%); opacity: 0.12;"
	></div>
	<div class="grain absolute inset-0 opacity-[0.1]"></div>
</div>
